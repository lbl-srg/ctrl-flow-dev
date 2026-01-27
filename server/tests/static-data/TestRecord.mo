within ;
model TestRecord
  record BaseRecord
  end BaseRecord;

  record Rec
    parameter Real p = 0;
  end Rec;

  model BaseModel
    replaceable parameter BaseRecord rec;
  end BaseModel;

  model Mod
    extends BaseModel(
      redeclare Rec rec);
    parameter Rec localRec = rec;
  end Mod;

  model Mod1
    extends BaseModel(
      redeclare Rec rec=localRec);
    parameter Rec localRec(p=1);
  end Mod1;

  Mod mod;

  Mod1 mod1;

  Mod mod2(localRec=mod1.localRec);

end TestRecord;
