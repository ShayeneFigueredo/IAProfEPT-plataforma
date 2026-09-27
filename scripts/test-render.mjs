import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from '../src/App.jsx';
import HomeView from '../src/views/HomeView.jsx';
import FormativoView from '../src/views/FormativoView.jsx';
import LaboratorioView from '../src/views/LaboratorioView.jsx';
import RepositorioView from '../src/views/RepositorioView.jsx';
import ReflexaoView from '../src/views/ReflexaoView.jsx';
import SuporteView from '../src/views/SuporteView.jsx';

console.log('Testing HomeView...');
ReactDOMServer.renderToString(React.createElement(HomeView, { setTab: () => {} }));
console.log('HomeView OK');

console.log('Testing FormativoView...');
ReactDOMServer.renderToString(React.createElement(FormativoView));
console.log('FormativoView OK');

console.log('Testing LaboratorioView...');
ReactDOMServer.renderToString(React.createElement(LaboratorioView));
console.log('LaboratorioView OK');

console.log('Testing RepositorioView...');
ReactDOMServer.renderToString(React.createElement(RepositorioView));
console.log('RepositorioView OK');

console.log('Testing ReflexaoView...');
ReactDOMServer.renderToString(React.createElement(ReflexaoView));
console.log('ReflexaoView OK');

console.log('Testing SuporteView...');
ReactDOMServer.renderToString(React.createElement(SuporteView));
console.log('SuporteView OK');

console.log('Testing Full App...');
ReactDOMServer.renderToString(React.createElement(App));
console.log('App OK! ALL VIEWS RENDERED SUCCESSFULLY');
