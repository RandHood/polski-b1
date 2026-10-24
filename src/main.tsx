import { render } from 'preact';
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import '@fontsource/jost/600.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/source-serif-4/700.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import './styles/global.css';
import { App } from './app/App';
import { requestPersistence } from './services/db';

render(<App />, document.getElementById('app')!);
requestPersistence();
