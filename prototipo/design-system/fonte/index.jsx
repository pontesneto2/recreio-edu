import * as core from './core.jsx';
import * as actions from './actions.jsx';
import * as inputs from './inputs.jsx';
import * as feedback from './feedback.jsx';
import * as navigation from './navigation.jsx';
import * as data from './data.jsx';
import * as school from './school.jsx';
import * as modules from './modules.jsx';

const Recreio = { ...core, ...actions, ...inputs, ...feedback, ...navigation, ...data, ...school, ...modules };
window.Recreio = Object.assign(window.Recreio || {}, Recreio);
