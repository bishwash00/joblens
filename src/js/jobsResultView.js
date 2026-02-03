import icons from 'url:../img/icons.svg';

class jobsResultView {
  _parentEl = document.querySelector('.results');
  _message;
  _errMSG = '';
  _data;

  render(data) {
    this._data = data;

    const markup = this._generateMarkup();
  }

  _generateMarkup() {}
}

export default new jobsResultView();
