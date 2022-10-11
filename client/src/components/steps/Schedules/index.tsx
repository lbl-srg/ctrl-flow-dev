import PageHeader from "../../PageHeader";
import AddUserSystemsWidget from "./AddUserSystemsWidget";
import UserSystemTable from "./UserSystemTable";
import { Fragment, useState } from "react";
import itl from "../../../translations";

import "../../../styles/steps/schedules.scss";
import { useStores } from "../../../data";
import { observer } from "mobx-react";

const Schedules = observer(() => {
  const { uiStore, templateStore } = useStores();
  const activeTemplate = uiStore.activeTemplate;
  const [isFullscreen, setFullscreen] = useState(false);

  const groupedOptions = {
    options: [],
  };

  const fieldNames: string[] = [];
  const newObject = {options: []};

  console.log('activeTemplate: ', activeTemplate);
  const scheduleOptions = templateStore.getScheduleOptionsForTemplate(activeTemplate?.scheduleOptionPaths);
  scheduleOptions?.forEach((opt: any) => {
    if (opt.groups.length) {
      let groupedName = opt.groups.map((g) => {
        return templateStore.getOption(g)?.group;
      });
      groupedName.push(opt.group);
      // console.log('groupedName: ', groupedName);
      groupedName = groupedName.filter((e) => e) || ['options'];
      if (groupedName.length) {
        groupedName.reduce((oldObj, key, index) => {
          if (groupedName.length === index+1) {
            // console.log('oldObj: ', oldObj);
            // console.log('key: ', key);
            if (oldObj[key]?.options) {
              oldObj[key].options.push(opt);
            } else {
              console.log('oldObj[key]: ', oldObj[key]);
              oldObj[key] = { ...oldObj[key], options: [opt] };
            }
            return oldObj[key];
          }
          return oldObj[key] = oldObj[key] || {};
        }, newObject);
      }

      // groupedName = groupedName.filter((e) => e).join('.') || 'options';
      // fieldNames.push(groupedName);
      // if (groupedOptions[groupedName]) {
      //   groupedOptions[groupedName].push(opt)
      // } else {
      //   groupedOptions[groupedName] = [opt];
      // }
    } else {
      if (opt.group) {
        if (newObject[opt.group]?.options) {
          newObject[opt.group].options.push(opt);
        } else {
          newObject[opt.group] = { ...newObject[opt.group], options: [opt] };
        }
      } else {
        newObject.options.push(opt);
      }
      // if (opt.group) {
      //   if (groupedOptions[opt.group]) {
      //     groupedOptions[opt.group].push(opt);
      //   } else {
      //     groupedOptions[opt.group] = [opt];
      //   }
      // } else {
      //   groupedOptions.options.push(opt);
      // }
    }
  });
  // console.log('fieldNames before uniq: ', fieldNames);
  // console.log('fieldNames: ', [...new Set(fieldNames)]);
  // console.log('groupedOptions: ', groupedOptions);
  // console.log('scheduleOptions: ', scheduleOptions.forEach((opt) => console.log(opt.groups)));

  // let newObject = {};

  // [...new Set(fieldNames)].forEach((n) => {
  //   const splitNames = n.split('.');
  //   console.log('splitNames: ', splitNames);
  //   splitNames.reduce((oldObj, key, index) => {
  //     return oldObj[key] = oldObj[key] || {};
  //   }, newObject);
  // });

  console.log('newObject: ', newObject);

  // const groupedFieldNames = [...new Set(fieldNames)].map((n) => {
  //   const splitNames = n.split('.');
  //   if (splitNames.length === 1) {
  //     return {
  //       groupName: splitNames[0],
  //       fieldNames: []
  //     }
  //   }
  //   return {
  //     groupName: splitNames[0],
  //     fieldNames: splitNames.slice(1)
  //   }
  // });

  // let groupedFieldNames = {};

  // [...new Set(fieldNames)].map((n) => {
  //   const splitNames = n.split('.');

  //   if (groupedFieldNames[splitNames[0]]) {

  //   }
  // }


  // console.log(groupedFieldNames);

  return (
    <Fragment>
      <PageHeader headerText="Equipment Schedules" />

      <div className="schedules-page">
        <h4>{itl.phrases.scheduleInstruct}</h4>

        <div
          className={
            isFullscreen
              ? "schedule-container fullscreen"
              : "schedule-container"
          }
        >
          <h3 className="with-links">
            {activeTemplate?.name}
            <div className="links">
              <a onClick={() => setFullscreen(!isFullscreen)}>
                <i
                  className={
                    isFullscreen ? "icon-fullscreen-exit" : "icon-fullscreen"
                  }
                />
                {itl.terms.toggleFullscreen}
              </a>
              <a>
                <i className="icon-upload" />
                {itl.terms.upload}
              </a>
              <a>
                <i className="icon-download" />
                {itl.terms.download}
              </a>
            </div>
          </h3>
          {activeTemplate ? <AddUserSystemsWidget /> : null}
          {/* <button onClick={() => userSystems.map((s) => removeUserSystem(s))}>
          Remove Systems
        </button> */}
          <UserSystemTable scheduleOptions={newObject} />
        </div>
      </div>
    </Fragment>
  );
});

export default Schedules;
