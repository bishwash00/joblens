import icons from 'url:../../img/icons.svg';

class jobsResultView {
  _parentEl = document.querySelector('.results');
  _emptyEl = this._parentEl.querySelector('.results__empty');
  _resultsGridEl = this._parentEl.querySelector('.results__grid');
  _resultsCountEl = this._parentEl.querySelector('.results__count strong');

  _data;

  render(data) {
    this._emptyEl.classList.add('hidden');

    this._data = data;

    this._resultsCountEl.textContent = data.count;

    const markup = this._generateMarkup();

    this._resultsGridEl.insertAdjacentHTML('beforeend', markup);
  }

  _generateMarkup() {
    return `
        ${this._data.results
          .map(
            data => `
          <article class="job-card" data-job-id="${data.id}">
                <div class="job-card__header">
                  <div class="job-card__company-logo" data-company-logo>
                    <span>G</span>
                  </div>
                  <div class="job-card__meta">
                    <span class="job-card__company">${data.companyName}</span>
                    <span class="job-card__location">
                      <svg>
                        <use href="${icons}#icon-location"></use>
                      </svg>
                      ${data.location}
                    </span>
                  </div>
                  <button
                    class="job-card__bookmark"
                    data-bookmark-btn
                    aria-label="Bookmark job"
                  >
                    <svg>
                      <use href="${icons}#icon-bookmark"></use>
                    </svg>
                  </button>
                </div>

                <div class="job-card__body">
                  <h3 class="job-card__title">${data.title}</h3>
                  <p class="job-card__description">
                    ${data.description}
                  </p>

                  <div class="job-card__tags">
                    <span class="job-card__tag job-card__tag--remote"
                      >Remote</span
                    >
                    <span class="job-card__tag job-card__tag--fulltime"
                      >${data.contractTime === 'full_time' ? 'Full-time' : 'Part-time'}</span
                    >
                    <span class="job-card__tag">React</span>
                    <span class="job-card__tag">TypeScript</span>
                  </div>
                </div>

                <div class="job-card__footer">
                  <div class="job-card__salary">
                    <svg>
                      <use href="${icons}#icon-dollar"></use>
                    </svg>
                    <span class="job-card__salary-amount" data-salary
                      >$${data.salaryMin} - $${data.salaryMax}</span
                    >
                  </div>
                  <span class="job-card__posted">${data.date}</span>
                </div>
              </article>
          `,
          )
          .join('')}`;
  }
}

export default new jobsResultView();
