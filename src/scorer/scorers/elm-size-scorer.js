import {ScorerHelper} from './../scorer-helper';

export default class ElmSizeScorer {

  constructor(name, settings){
    this.name = name;
    this._settings = settings;
    this._sizeType = {
      SMALL: 'small',
      MEDIUM: 'medium',
      LARGE: 'large',
      UNKNOWN: 'unknown'
    };
    this._small = settings && settings["elm-size"] && settings["elm-size"].small || 32*32;
    this._large = settings && settings["elm-size"] && settings["elm-size"].large || 128*128;
  }

  score(elm, val) {
    //val can be small|medium|large
    if (!val || !elm) {
      return 0;
    }
    var rect = elm.rect;
    if (!rect || rect.width === 0 || rect.height === 0) {
      return 0;
    }
    let score = 0;
    let sizeType = this._sizeType[val.toUpperCase()] || this._sizeType.UNKNOWN;
    let size = rect.width * rect.height;
    if (sizeType === this._sizeType.SMALL) {
      if (size < this._small) {
        score = 1;
      } else if (size > this._large) {
        score = 0;
      } else {
        score = (size - this._small) / (this._large - this._small);
        score = 1 - score;
      }
    } else if (sizeType === this._sizeType.LARGE) {
      if (size > this._large) {
        score = 1;
      } else if (size < this._small) {
        score = 0;
      } else {
        score = (size - this._small) / (this._large - this._small);
      }
    } else if (sizeType === this._sizeType.MEDIUM) {
      if (size < this._small || size > this._large) {
        score = 0;
      } else {
        let maxScore = 0;
        maxScore = Math.max(maxScore, this.score(elm, this._sizeType.SMALL));
        maxScore = Math.max(maxScore, this.score(elm, this._sizeType.LARGE));
        score = 1 - maxScore;
      }
    }
    return score;
  }

}
