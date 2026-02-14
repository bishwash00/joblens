class HeaderView {
  _parentEl = document.querySelector('.header');
  _navBtns = document.querySelectorAll('.header__nav-btn');
  _sections = document.querySelectorAll('section');
  _currenySelector = this._parentEl.querySelector('.currency-selector__select');

  addHandlerCurrency(handler) {
    this._currenySelector.addEventListener('change', function (e) {
      console.log(e.target.value);

      handler(e.target.value);
    });
  }

  addHandlerNavBtn() {
    this._navBtns.forEach(btn =>
      btn.addEventListener('click', () => {
        this._resetNavBtns();
        this._resetSections();

        btn.classList.add('header__nav-btn--active');

        const query = btn.dataset.view;
        const section = document.querySelector(
          `[data-view-container="${query}"]`,
        );
        section.classList.remove('hidden');
      }),
    );
  }

  _resetNavBtns() {
    this._navBtns.forEach(btn =>
      btn.classList.remove('header__nav-btn--active'),
    );
  }

  _resetSections() {
    this._sections.forEach(section => section.classList.add('hidden'));
  }
}

export default new HeaderView();
