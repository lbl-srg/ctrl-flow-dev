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

  model Nested
    parameter Rec localRecFirst(p=-1);
    parameter Rec localRec(p=3);
    Mod mod(rec=localRec);
  end Nested;

  model NestedExtended
    extends Nested(
      localRec(p=4),
      localRecFirst(p=-2));
    Mod1 mod1;
  end NestedExtended;
  Mod mod;

  Mod1 mod1;

  Mod mod2(localRec=mod1.localRec);

  Mod mod3(rec=Rec(p=2));

  Nested nes;

  NestedExtended nesExt;

  NestedExtended nesExt1(mod1(localRec(p=-3)));

end TestRecord;
