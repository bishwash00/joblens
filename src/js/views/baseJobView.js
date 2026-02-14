import icons from 'url:../../img/icons.svg';
import {
  formatCurrency,
  formatPostedDate,
  truncateText,
  getCompanyInitial,
} from '../helpers.js';

class BaseJobView {
  _data;

  async _formatSalaryDisplay(job, currency = 'USD', convertTo = null) {
    if (job.salaryMin && job.salaryMax) {
      return `${await formatCurrency(job.salaryMin, currency, convertTo)} - ${await formatCurrency(job.salaryMax, currency, convertTo)}`;
    } else if (job.salaryMin) {
      return `${await formatCurrency(job.salaryMin, currency, convertTo)}+`;
    } else if (job.salaryMax) {
      return `Up to ${await formatCurrency(job.salaryMax, currency, convertTo)}`;
    }
    return 'Salary not specified';
  }

  _getJobTypeTag(jobType) {
    const typeMap = {
      FULLTIME: 'Full-time',
      PARTTIME: 'Part-time',
      CONTRACTOR: 'Contract',
      INTERN: 'Internship',
    };

    const displayType = typeMap[jobType] || jobType || 'Full-time';
    const cssClass = jobType?.toLowerCase() || 'fulltime';

    return `<span class="job-card__tag job-card__tag--${cssClass}">${displayType}</span>`;
  }

  _getCompanyInitial(companyName) {
    return getCompanyInitial(companyName);
  }

  _formatPostedDate(postedDate) {
    return formatPostedDate(postedDate);
  }

  _truncateText(text, length) {
    return truncateText(text, length);
  }
}

export default BaseJobView;
