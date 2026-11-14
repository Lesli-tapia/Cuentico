const fs=require('fs'),path=require('path');
const sampleRate=22050;let seed=42;const noise=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2147483648-1};
function create(name,duration,sample){const count=Math.floor(sampleRate*duration),out=Buffer.alloc(44+count*2);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(sampleRate,24);out.writeUInt32LE(sampleRate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(count*2,40);for(let i=0;i<count;i++){const t=i/sampleRate,fade=Math.min(1,t/.05,(duration-t)/.1);out.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample(t)*fade))*.55*32767),44+i*2)}const dir=path.join(__dirname,'../public/assets/audio');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,name+'.wav'),out)}
const sine=(hz,t)=>Math.sin(2*Math.PI*hz*t);
create('birds',2.4,t=>{const x=t%.65;return x<.18?sine(1700+900*x/.18,t)*Math.sin(Math.PI*x/.18)*.45:0});
create('steps',1.8,t=>{const x=t%.48;return x<.13?(noise()*.45+sine(95,t)*.3)*Math.exp(-x*35):0});
create('water',2.8,t=>noise()*.22*(.7+.3*sine(3,t))+sine(620+70*sine(5,t),t)*.035);
create('rain',2.8,t=>noise()*.19*(.8+.2*sine(13,t)));
create('roar',1.5,t=>{const env=Math.sin(Math.PI*t/1.5);return (sine(75+25*env,t)*.3+noise()*.23)*(1+.3*sine(28,t))*env});
create('sparkle',2,t=>{const notes=[784,988,1175,1568,1976],i=Math.min(4,Math.floor(t/.4)),x=t%.4;return sine(notes[i],t)*Math.exp(-x*10)*.38});
create('kitchen',1.5,t=>{const x=t%.32;return x<.08?(sine(520,t)*.25+noise()*.25)*Math.exp(-x*65):0});
// Stylized synthetic vocal effects, not recordings of actual children.
function vowel(t,pitch,f1,f2){let value=0;for(let h=1;h<=18;h++){const hz=pitch*h;const weight=Math.exp(-Math.pow((hz-f1)/230,2))+.55*Math.exp(-Math.pow((hz-f2)/330,2));value+=sine(hz,t)*weight/h;}return value;}
create('children-laugh',2.6,t=>{const phase=t%.38;const env=phase<.23?Math.sin(Math.PI*phase/.23):0;return vowel(t,310+20*sine(4,t),850,1450)*env*.8;});
create('sad-sigh',1.6,t=>{const env=Math.sin(Math.PI*t/1.6);return (noise()*.16+vowel(t,240-55*t,600,1150)*.35)*env;});
create('child-wow',1.5,t=>{const open=Math.sin(Math.PI*t/1.5);return vowel(t,300+35*open,320+500*open,850+500*open)*Math.sin(Math.PI*t/1.5)*.9;});
create('stumble',.65,t=>{const x=t%.17;return (noise()*.4+sine(125,t)*.2)*Math.exp(-x*35)*(1-t/.65)});
create('fall',.9,t=>(noise()*.35+sine(65,t)*.35)*Math.exp(-t*8));
create('wind',2.4,t=>noise()*.12*Math.sin(Math.PI*t/2.4));
console.log('Generated 13 original stylized sound effects.');
