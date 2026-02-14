import icons from 'url:../../img/icons.svg';
import BaseJobView from './baseJobView';

class BookmarksView extends BaseJobView {
  _parentEl = document.querySelector('.bookmarks');
  _bookmarksList = this._parentEl?.querySelector('[data-bookmarks-list]');
  _headerBookmarkCount = document.querySelector('[data-bookmark-count]');
  _bookmarksEmpty = this._parentEl?.querySelector('[data-bookmarks-empty]');
  _data;

  async render(data, currency = undefined) {
    if (!currency) this._data = data;
    else {
      this._data = data;
      this._currencyVal = currency;
    }

    if (this._data.length === 0) {
      this._bookmarksEmpty.classList.remove('hidden');
      this._headerBookmarkCount.textContent = this._data.length;
      this._bookmarksList.innerHTML = '';
    } else {
      this._bookmarksEmpty.classList.add('hidden');
      this._bookmarksList.innerHTML = '';
      this._headerBookmarkCount.textContent = this._data.length;

      const markup = await this._generateMarkup();
      this._bookmarksList.insertAdjacentHTML('beforeend', markup);
    }
  }

  async _generateMarkup() {
    const markupPromises = this._data.map(async job => {
      const companyInitial = this._getCompanyInitial(job.companyName);
      const salaryDisplay = await this._formatSalaryDisplay(
        job,
        this._currencyVal?.base,
        this._currencyVal?.target,
      );

      return `
                <article class="bookmark-item" data-bookmark-id="${job.id}">
                  <div class="bookmark-item__main">
                    <div class="bookmark-item__icon">
                       ${
                         job.companyLogo
                           ? `<img src="${job.companyLogo}" alt="${job.companyName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <span style="display:none;">${companyInitial}</span>`
                           : `<span>${companyInitial}</span>`
                       }
                    </div>
                    <div class="bookmark-item__info">
                      <h4 class="bookmark-item__title">${job.title}</h4>
                      <p class="bookmark-item__meta">
                        <span>Amazon</span>
                        <span class="bookmark-item__separator">•</span>
                        <span>${job.location}</span>
                      </p>
                      <div class="bookmark-item__tags">
                        <span class="bookmark-item__tag">${job.isRemote ? 'Remote' : 'On-site'}</span>
                        <span class="bookmark-item__tag">${salaryDisplay}</span>
                      </div>
                    </div>
                  </div>
                  <div class="bookmark-item__actions">
                    <button
                      class="bookmark-item__btn"
                      data-view-job
                      aria-label="View job details"
                    >
                      <svg><use href="${icons}#icon-eye"></use></svg>
                    </button>
                    <button
                      class="bookmark-item__btn bookmark-item__btn--remove"
                      data-remove-bookmark
                      aria-label="Remove bookmark"
                    >
                      <svg>
                        <use href="${icons}#icon-trash"></use>
                      </svg>
                    </button>
                  </div>
                </article>`;
    });

    const markups = await Promise.all(markupPromises);
    return markups.join('');
  }

  addHandlerRemoveBookmark(handler) {
    this._parentEl.addEventListener('click', function (e) {
      const btn = e.target.closest('.bookmark-item__btn--remove');
      if (!btn) return;

      const bookmarkItem = e.target.closest('.bookmark-item');
      const bookmarkId = bookmarkItem.dataset.bookmarkId;
      handler(bookmarkId);
    });
  }

  addHandlerViewBookmark(handler) {
    this._parentEl.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-view-job]');
      if (!btn) return;

      const bookmarkItem = e.target.closest('.bookmark-item');
      const bookmarkId = bookmarkItem.dataset.bookmarkId;
      handler(bookmarkId, 'bookmark');
    });
  }
}

export default new BookmarksView();
