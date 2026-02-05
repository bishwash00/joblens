import * as model from './model.js';
import jobsResultView from './views/jobsResultView.js';

const controlJobResults = async function (query) {
  try {
    await model.getJobs();

    jobsResultView.render(model.state.search);
  } catch (err) {
    console.log(err);
  }
};

const init = function () {};
init();
