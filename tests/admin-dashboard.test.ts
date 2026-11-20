import test from 'node:test';
import assert from 'node:assert/strict';
import { chartGeometry, getMetricSeries } from '../src/components/admin/dashboardData';
test('chart handles empty, single, negative and nonfinite financial values',()=>{
 for(const values of [[],[0],[20],[-200,-100],[100,-50,75],[NaN,Infinity]]){
  const chart=chartGeometry(values);
  assert.equal(chart.points.length,values.length);
  assert.ok(!/NaN|Infinity/.test(chart.path+chart.area));
  for(const point of chart.points){assert.ok(point.y>=20&&point.y<=191);assert.ok(point.x>=62&&point.x<=620);}
 }
 assert.ok(chartGeometry([-100,100]).points[0].y>chartGeometry([-100,100]).points[1].y);
});
test('period selection never repeats seven-day data for a missing thirty-day series',()=>{
 const point={date:'2026-10-18',deposits:10,withdrawals:2,netBalance:8};
 const metrics={chartData:[point]} as any;
 assert.deepEqual(getMetricSeries(metrics,'7d'),[point]);
 assert.deepEqual(getMetricSeries(metrics,'30d'),[]);
 assert.deepEqual(getMetricSeries(null,'today'),[]);
});
