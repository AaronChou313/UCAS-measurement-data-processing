import test from 'node:test';
import assert from 'node:assert/strict';
import { basisExample, matVec, rotation, solve2, markovModels, markovDistribution, markovStep, covarianceEllipse, ellipsePoint, covariancePlot, advanceMarkov, formatNumber } from '../.vitepress/theme/visualizations/math.mjs';
const close = (a, b, tolerance = 1e-11) => assert.ok(Math.abs(a-b) < tolerance, `${a} != ${b}`);
const vectorClose = (a, b) => a.forEach((x, i) => close(x, b[i]));

test('V01: 同一物理向量的标准坐标和斜基坐标', () => {
  vectorClose(solve2(basisExample.basis, basisExample.vector), [2,1]);
  vectorClose(matVec(basisExample.basis,[2,1]), [3,1]);
  assert.throws(() => solve2([[1,1],[2,2]],[1,2]), RangeError);
});
test('V01: 主动/被动的具体例和长度不变', () => {
  vectorClose(matVec(rotation(Math.PI/2),[3,1]),[-1,3]);
  vectorClose(matVec(rotation(-Math.PI/2),[3,1]),[1,-3]);
  for (let i=-24;i<=24;i++) {
    const a=i*Math.PI/12, v=[3,-2], rv=matVec(rotation(a),v);
    close(rv[0]**2+rv[1]**2,13);
    vectorClose(matVec(rotation(-a),rv),v);
  }
});
test('V01: 先旋转再缩放与先缩放再旋转不同', () => {
  const r=rotation(Math.PI/2), s=[[2,0],[0,1]];
  vectorClose(matVec(s,matVec(r,[1,0])),[0,1]);
  vectorClose(matVec(r,matVec(s,[1,0])),[0,2]);
});
test('V18: 正文两步、来源贡献和平稳流量', () => {
  const {matrix}=markovModels.city;
  const step=markovStep(matrix,[.8,.2]);
  vectorClose(step.contributions[0],[.76,.006]);
  vectorClose(step.next,[.766,.234]);
  vectorClose(markovDistribution('city',.8,2),[.73472,.26528]);
  vectorClose(matVec(matrix,[.375,.625]),[.375,.625]);
  close(.05*.375,.03*.625);
});
test('V18: 各列和为1；所有预设、初值和60步均守恒且符合闭式', () => {
  for(const [id,model] of Object.entries(markovModels)) {
    for(let j=0;j<2;j++)close(model.matrix[0][j]+model.matrix[1][j],1);
    for(const initial of [0,.375,.5,.8,1])for(let k=0;k<=60;k++){
      const p=markovDistribution(id,initial,k);
      close(p[0]+p[1],1); assert.ok(p.every(x=>x>=0 && x<=1));
      const expected=id==='city'?.375+.92**k*(initial-.375):id==='alternating'?(k%2?1-initial:initial):initial;
      close(p[0],expected);
    }
  }
});
test('V18: 存在/唯一不等于收敛；边界输入不静默修补', () => {
  vectorClose(markovDistribution('alternating',1,1),[0,1]);
  vectorClose(markovDistribution('alternating',1,2),[1,0]);
  vectorClose(markovDistribution('alternating',.5,59),[.5,.5]);
  vectorClose(markovDistribution('identity',.8,60),[.8,.2]);
  assert.equal(markovModels.identity.stationary,null);
  for(const args of [['city',1.1,0],['city',.5,-1],['city',.5,1.5],['invalid',.5,0]])assert.throws(()=>markovDistribution(...args),RangeError);
});

test('V14: 默认已知 C 的解析特征值、倾角与概率尺度', () => {
  const m=covarianceEllipse(.5);
  vectorClose(m.covariance[0],[4,1]);
  close(m.lambda1,(5+Math.sqrt(13))/2);
  close(m.lambda2,(5-Math.sqrt(13))/2);
  close(m.angle*180/Math.PI,16.84503376298989);
  close(m.s,5.99146454710798);
  close(m.directionVariance,3.5);
  close(m.principalSD[0],Math.sqrt((5+Math.sqrt(13))/2));
});

test('V14: 全部 39 档 ρ 的正定性、特征方程及两条边界二次型', () => {
  for(let j=-19;j<=19;j++){
    const m=covarianceEllipse(j*.05), c=m.covariance;
    assert.ok(m.determinant>0 && m.lambda2>0);
    close(m.lambda1+m.lambda2,5);
    close(m.lambda1*m.lambda2,m.determinant);
    for(let k=0;k<2;k++){
      const angle=m.angle+k*Math.PI/2, u=[Math.cos(angle),Math.sin(angle)];
      const lambda=[m.lambda1,m.lambda2][k];
      vectorClose(matVec(c,u),u.map(x=>lambda*x));
    }
    for(const s of [1,m.s])for(let k=0;k<181;k++){
      const [x,y]=ellipsePoint(m,k*Math.PI/90,s);
      const d2=(x*x-4*m.rho*x*y+4*y*y)/m.determinant;
      close(d2,s,2e-10);
    }
  }
});

test('V14: 投影极值验证坐标半宽与方向半宽，区别射线半径', () => {
  for(let j=-19;j<=19;j++)for(const s of [1,covarianceEllipse().s]){
    const m=covarianceEllipse(j*.05);
    // Optimize uᵀQ diag(sqrt(sλ)) (cos t,sin t) independently in parameter space.
    for(const u of [[1,0],[0,1],[1/Math.SQRT2,1/Math.SQRT2]]){
      const q1=[Math.cos(m.angle),Math.sin(m.angle)],q2=[-Math.sin(m.angle),Math.cos(m.angle)];
      const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
      const t=Math.atan2(Math.sqrt(s*m.lambda2)*dot(u,q2),Math.sqrt(s*m.lambda1)*dot(u,q1));
      const support=dot(u,ellipsePoint(m,t,s));
      const variance=dot(u,matVec(m.covariance,u));
      close(support,Math.sqrt(s*variance));
      if(u[0]===1)close(support,2*Math.sqrt(s));
      if(u[1]===1)close(support,Math.sqrt(s));
    }
  }
  const m=covarianceEllipse(.5), u=[1/Math.SQRT2,1/Math.SQRT2];
  const projection=Math.sqrt(m.s*m.directionVariance);
  const inverse=solve2(m.covariance,u);
  const radius=Math.sqrt(m.s/(u[0]*inverse[0]+u[1]*inverse[1]));
  assert.ok(projection>radius+.5); // These two lengths must not silently be identified.
});

test('V14: 变号镜像、固定方向方差及阈值平方根规律', () => {
  for(let j=0;j<=19;j++){
    const m=covarianceEllipse(j*.05), mirror=covarianceEllipse(-j*.05);
    close(m.lambda1,mirror.lambda1);close(m.lambda2,mirror.lambda2);close(m.angle,-mirror.angle);
    close(m.directionVariance,2.5+2*j*.05);
  }
  const one=covarianceEllipse(.5,1-Math.exp(-.5)),four=covarianceEllipse(.5,1-Math.exp(-2));
  close(one.s,1);close(four.s,4);
  vectorClose(four.semiaxes,one.semiaxes.map(x=>2*x));
});

test('V14: 已知二维 Gaussian 的覆盖率用密度数值积分独立核对', () => {
  // Integrate the chi-square(2) density 0.5 exp(-t/2), not point-count simulation.
  for(const q of [1-Math.exp(-.5),1-Math.exp(-2),.95]){
    const {s}=covarianceEllipse(.5,q), n=10000, h=s/n;
    let integral=0;
    for(let j=0;j<=n;j++)integral+=(j===0||j===n?.5:1)*.5*Math.exp(-j*h/2);
    close(integral*h,q,1e-8);
  }
});

test('V14: 奇异、非有限与无效概率拒绝计算', () => {
  for(const rho of [-1,1,2,NaN,Infinity])assert.throws(()=>covarianceEllipse(rho),RangeError);
  for(const q of [0,1,-.1,NaN,Infinity])assert.throws(()=>covarianceEllipse(.5,q),RangeError);
  assert.throws(()=>ellipsePoint(covarianceEllipse(),0,0),RangeError);
});

test('V18: 非法矩阵/分布及原型名称拒绝计算，不能混用行随机约定', () => {
  for(const matrix of [[[.95,.05],[.03,.97]], [[1,1],[0,-1]], [[1,NaN],[0,1]], [[1]], null])
    assert.throws(()=>markovStep(matrix,[.8,.2]),RangeError);
  for(const distribution of [[.8,.3],[-.1,1.1],[NaN,1],[.8],null])
    assert.throws(()=>markovStep(markovModels.city.matrix,distribution),RangeError);
  for(const model of ['toString','constructor','__proto__',null,undefined,['city']])assert.throws(()=>markovDistribution(model,.5,0),RangeError);
});

test('V18: 时间控件逐步、跳步、重置与上限使用同一合法离散时刻', () => {
  let k=0;
  for(let i=0;i<60;i++){k=advanceMarkov(k,'next');assert.equal(k,i+1);}
  assert.equal(advanceMarkov(60,'next'),60);
  assert.equal(advanceMarkov(55,'jump'),60);
  assert.equal(advanceMarkov(10,'jump'),20);
  assert.equal(advanceMarkov(60,'reset'),0);
  for(const k of [-1,61,.5,NaN,Infinity,null])assert.throws(()=>advanceMarkov(k,'next'),RangeError);
  assert.throws(()=>advanceMarkov(0,'play'),RangeError);
  // Jumping changes only the queried time, not the transition law.
  vectorClose(markovDistribution('city',.8,advanceMarkov(10,'jump')),markovDistribution('city',.8,20));
});

test('V14: SVG实际路径、主轴与外切框均使用同一模型且等比例', () => {
  for(let i=-19;i<=19;i++)for(const probability of [false,true]){
    const m=covarianceEllipse(i*.05), g=covariancePlot(m,probability);
    close(g.px(1)-g.px(0),g.py(0)-g.py(1));
    close(g.halfWidth,2*Math.sqrt(g.threshold));close(g.halfHeight,Math.sqrt(g.threshold));
    g.axes.forEach((p,j)=>close(Math.hypot(...p),Math.sqrt(g.threshold*[m.lambda1,m.lambda2][j])));
    for(const [path,s] of [[g.path,g.threshold],[g.innerPath,1]]){
      const points=[...path.matchAll(/[ML]([\d.-]+),([\d.-]+)/g)];assert.equal(points.length,181);
      for(const [,screenX,screenY] of points){
        const x=(+screenX-180)/g.scale,y=(125-screenY)/g.scale;
        close((x*x-4*m.rho*x*y+4*y*y)/m.determinant,s,0.002);
        assert.ok(+screenX>=0 && +screenX<=360 && +screenY>=0 && +screenY<=250);
      }
    }
  }
});

test('显示舍入不修改原值；不出现负零，拒绝非有限格式参数', () => {
  const value=-1e-9;assert.equal(formatNumber(value,3,true),'0.000');assert.equal(value,-1e-9);
  assert.equal(formatNumber(.73472,5),'0.73472');assert.equal(formatNumber(.5,3,true),'0.500');
  for(const args of [[NaN,3],[Infinity,3],[1,-1],[1,11],[1,.5]])assert.throws(()=>formatNumber(...args),RangeError);
});

test('状态/绘图接口拒绝不匹配的上下文，不静默画错概率尺度', () => {
  assert.throws(()=>advanceMarkov(null,'next'),RangeError);
  assert.throws(()=>covariancePlot(covarianceEllipse(.5,.9),true),RangeError);
});
