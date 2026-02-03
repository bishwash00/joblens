import * as model from './model.js';
import jobsResultView from './jobsResultView.js';

const controlJobResults = async function () {
  try {
    await model.controlJobs();
  } catch (err) {
    console.log(err);
  }
};

controlJobResults();
