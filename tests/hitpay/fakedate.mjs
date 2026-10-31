// 把时间换成 FAKE_AT（ISO），之后照常走
const RealDate=Date, off=process.env.FAKE_AT?RealDate.parse(process.env.FAKE_AT)-RealDate.now():0;
class FD extends RealDate{ constructor(...a){ if(a.length) super(...a); else super(RealDate.now()+off); } static now(){ return RealDate.now()+off; } }
globalThis.Date=FD;
