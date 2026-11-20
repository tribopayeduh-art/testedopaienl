import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {GameBrandContext} from '../src/components/GameBrandContext';
import {InexLoader} from '../src/components/InexLoader';
import {GAMES_SEO_DATA,generateGameSchema,resolveGameSEOKey} from '../src/lib/seo';
test('game loading has no platform logo, GIF or accessible brand while portal retains branding',()=>{
 const game=renderToStaticMarkup(React.createElement(GameBrandContext.Provider,{value:true},React.createElement(InexLoader,{fullScreen:true,label:'Abrindo iNEX'})));
 assert.doesNotMatch(game,/inex/i);assert.match(game,/Carregando jogo/);
 const portal=renderToStaticMarkup(React.createElement(InexLoader));assert.match(portal,/inex-loading.gif/);
});
test('each game schema uses game identity, including canonical Count Masters aliases',()=>{
 for(const key of ['bubbleblast','subwaypay','gen-dino','raspa-fortuna','blockwin','countmasters']){
  assert.doesNotMatch(JSON.stringify(generateGameSchema(GAMES_SEO_DATA[key],'https://example.test')),/inex|allifavicon/i);
 }
 assert.equal(resolveGameSEOKey('g_count_masters'),'countmasters');
 assert.match(JSON.stringify(generateGameSchema(GAMES_SEO_DATA['alliance-hub'],'https://example.test')),/iNEX/);
});
