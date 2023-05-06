(function () {
  'use strict';

  /**
   * Поучить время
   * @param {string} val 
   * @returns {number}
   */
  function time(val) {
    var regex = /(\d+):(\d{2}):(\d{2})[.,](\d{3})/;
    var parts = regex.exec(val);
    if (parts === null) return 0;
    for (var i = 1; i < 5; i++) {
      parts[i] = parseInt(parts[i], 10);
      if (isNaN(parts[i])) parts[i] = 0;
    }

    //hours + minutes + seconds + ms
    return parts[1] * 3600000 + parts[2] * 60000 + parts[3] * 1000 + parts[4];
  }

  /**
   * Парсить
   * @param {string} data 
   * @param {boolean} ms 
   * @returns 
   */
  function parse$1(data, ms) {
    if (/WEBVTT/gi.test(data)) return parseVTT(data, ms);else return parseSRT(data, ms);
  }

  /**
   * Парсить SRT
   * @param {string} data 
   * @param {boolean} ms 
   * @returns {[{id:string, startTime:number, endTime:number, text:string}]}
   */
  function parseSRT(data, ms) {
    var useMs = ms ? true : false;
    data = data.replace(/\r\n/g, '\n');
    data = data.replace(/\r/g, '\n');
    var regex = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g;
    data = data.split(regex);
    data.shift();
    var items = [];
    for (var i = 0; i < data.length; i += 4) {
      items.push({
        id: data[i].trim(),
        startTime: useMs ? time(data[i + 1].trim()) : data[i + 1].trim(),
        endTime: useMs ? time(data[i + 2].trim()) : data[i + 2].trim(),
        text: data[i + 3].trim()
      });
    }
    return items;
  }

  /**
   * Парсить VTT
   * @param {string} data 
   * @param {boolean} ms
   * @returns {[{id:string, startTime:number, endTime:number, text:string}]}
   */
  function parseVTT(data, ms) {
    var useMs = ms ? true : false;
    data = data.replace(/\r\n/g, '\n');
    data = data.replace(/\r/g, '\n');
    data = data.replace(/(\d{2}):(\d{2})\.(\d{3})[ \t]+-->[ \t]+(\d{2}):(\d{2})\.(\d{3})/g, '00:$1:$2.$3 --> 00:$4:$5.$6');
    var regex = /(\n\n.+\n)?[ \t]*(\d{2}:\d{2}:\d{2}\.\d{3})[ \t]+-->[ \t]+(\d{2}:\d{2}:\d{2}\.\d{3})/g;
    data = data.split(regex);
    data.shift();
    var items = [];
    for (var i = 0; i < data.length; i += 4) {
      items.push({
        id: (data[i] || '').trim(),
        startTime: useMs ? time(data[i + 1].trim()) : data[i + 1].trim(),
        endTime: useMs ? time(data[i + 2].trim()) : data[i + 2].trim(),
        text: data[i + 3].trim()
      });
    }
    return items;
  }

  /**
   * Класс
   */
  var parsed;
  function CustomSubs() {
    var network = new Lampa.Reguest();
    this.listener = window.Lampa.Subscribe();

    /**
     * Загрузить
     * @param {string} url 
     */
    this.load = function (url) {
      network.silent(url, function (data) {
        if (data) {
          parsed = parse$1(data, true);
        }
      }, false, false, {
        dataType: 'text'
      });
    };

    /**
     * Показать текст
     * @param {number} time_sec 
     */
    this.update = function (time_sec) {
      var time_ms = time_sec * 1000;
      if (parsed) {
        var text = '';
        for (var i = 0; i < parsed.length; i++) {
          var sub = parsed[i];
          if (time_ms > sub.startTime && time_ms < sub.endTime) {
            text = sub.text.replace("\n", '<br>');
            break;
          }
        }
        this.listener.send('subtitle', {
          text: text.trim()
        });
      }
    };

    /**
     * Уничтожить
     */
    this.destroy = function () {
      network.clear();
      network = null;
      this.listener = null;
    };
  }
  function getParsed() {
    return parsed;
  }

  var customsubsUp;
  function videoSubtle() {
    customsubsUp = new CustomSubsUp();
    listener.follow('subsviewUp', function (e) {
      setSubtitleUp();
    });
    customsubsUp.listener.follow('subtitleUp', function (e) {
      document.querySelector('.on-top .player-video__subtitles-text').outerHTML = "<div class=\"player-video__subtitles-text\">".concat(e.text, "</div>");
    });
    var video = window.Lampa.PlayerVideo.video();
    video.addEventListener('timeupdate', function () {
      if (!video.rewind) listener.send('timeupdate', {
        duration: video.duration,
        current: video.currentTime
      });
      listener.send('videosize', {
        width: video.videoWidth,
        height: video.videoHeight
      });
      if (customsubsUp) customsubsUp.update(video.currentTime);
    });
  }
  function CustomSubsUp() {
    var network = new Lampa.Reguest();
    this.listener = Lampa.Subscribe();

    /**
     * Загрузить
     * @param {string} url 
     */
    this.load = function (url) {
      network.silent(url, function (data) {
        if (data) {
          parsed = parse(data, true);
        }
      }, false, false, {
        dataType: 'text'
      });
    };

    /**
     * Показать текст
     * @param {number} time_sec 
     */
    var parsed;
    this.update = function (time_sec) {
      var time_ms = time_sec * 1000;
      if (!parsed) parsed = getParsed();
      if (parsed) {
        var text = '';
        for (var i = 0; i < parsed.length; i++) {
          var sub = parsed[i];
          if (time_ms > sub.startTime && time_ms < sub.endTime) {
            text = sub.text.replace("\n", '<br>');
            break;
          }
        }
        this.listener.send('subtitleUp', {
          text: text.trim()
        });
      }
    };

    /**
     * Уничтожить
     */
    this.destroy = function () {
      network.clear();
      network = null;
      this.listener = null;
    };
  }

  var subsUp = [];
  var customSubsUp = window.Lampa.PlayerVideo.customSubsUp;
  function panel() {
    placeOnPanel();
    getSubtitleList();
  }
  function setSubtitleUp() {
    if (document.querySelector('.on-top .player-video__subtitles-text')) return;
    var subtitle = new DOMParser().parseFromString(window.Lampa.Template.all().player_video, "text/html").querySelector('.player-video__subtitles').cloneNode(true);
    subtitle.classList.add('on-top');
    subtitle.classList.remove('hide');
    // var player = new DOMParser().parseFromString(window.Lampa.Template.all().player_video, "text/html").querySelector('.player-video').cloneNode(true)

    // /*!!!!!*/
    // player.insertBefore(subtitle, player.querySelector('.player-video__subtitles'));
    // window.Lampa.Template.all().player_video = new XMLSerializer().serializeToString(player);
    document.querySelector('.player-video').insertBefore(subtitle, document.querySelector('.player-video__subtitles'));
  }
  function placeOnPanel() {
    var subs = window.Lampa.Template.get('player_panel')[0].querySelectorAll('div.player-panel__subs')[0].cloneNode(true);
    subs.classList.add('player-panel__subsUp');
    window.Lampa.Template.get('player_panel')[0].querySelectorAll('.player-panel__right')[0].appendChild(subs);
    console.log("double " + window.Lampa.Template.get('player_panel')[0]);
    var panel = new DOMParser().parseFromString(window.Lampa.Template.all().player_panel, "text/html");
    var panel_subs = panel.querySelector('.player-panel__subs').cloneNode(true);
    panel_subs.classList.remove('player-panel__subs');
    panel_subs.classList.add('player-panel__subsUp');
    panel.querySelector('.player-panel__right').insertBefore(panel_subs, panel.querySelector('.player-panel__subs'));
    window.Lampa.Template.all().player_panel = new XMLSerializer().serializeToString(panel);
  }
  var listener = window.Lampa.Subscribe();
  function getSubtitleList() {
    if (customSubsUp) {
      customSubsUp.forEach(function (element, p) {
        if (element.index !== -1) {
          var from = element;
          element.title = p + ' / ' + normalName(from.language && from.label ? from.language + ' / ' + from.label : from.language || from.label || window.Lampa.Lang.translate('player_unknown'));
        }
      });
      var any_select = subsUp.find(function (s) {
        return s.selected;
      });
      window.Lampa.Arrays.insert(customSubsUp, 0, {
        title: window.Lampa.Lang.translate('player_disabled'),
        selected: any_select ? false : true,
        index: -1
      });
    }
    $('.player-panel__subsUp').on('hover:enter', function () {
      if (subsUp.length) ;
      var enabled = window.Lampa.Controller.enabled();
      var index = -1;
      if (customSubsUp[0]) {
        var customsubsUp = new CustomSubs();
        if (!Object.getOwnPropertyDescriptor(customSubsUp[0], 'modeUp')) customSubsUp.forEach(function (sub) {
          index++;
          if (typeof sub.index == 'undefined') sub.index = index;
          if (!sub.ready) {
            sub.ready = true;
          }
          Object.defineProperty(sub, 'modeUp', {
            set: function set(v) {
              if (v == 'showing') {
                customsubsUp.load(sub.url);
              }
            },
            get: function get() {}
          });
        });
      }
      window.Lampa.Select.show({
        title: window.Lampa.Lang.translate('player_subs'),
        items: customSubsUp,
        //customsubsUp
        onSelect: function onSelect(a) {
          customSubsUp.forEach(function (element) {
            element.modeUp = 'disabled';
            element.selected = false;
          });
          a.modeUp = 'showing';
          a.selected = true;
          listener.send('subsviewUp', {
            status: a.index > -1
          });
          // setSubsUp(subsUp);
          window.Lampa.Controller.toggle(enabled.name);
        },
        onBack: function onBack() {
          window.Lampa.Controller.toggle(enabled.name);
        }
      });
    });
    window.Lampa.PlayerVideo.listener.follow('subs', function (e) {
      setSubsUp(e.subs);
    });
  }
  function normalName(name) {
    return name.replace(/^[0-9]+(\.)?([\t ]+)?/, '').replace(/\s#[0-9]+/, '');
  }
  function setSubsUp(su) {
    subsUp = su;
    customSubsUp = Lampa.Arrays.clone(subsUp);
    getSubtitleList();
    videoSubtle();
    setSubtitleUp();
    $('.player-panel__subsUp').toggleClass('hide', false);
  }

  function startPlugin() {
    window.subsUp = true;
    panel();
  }
  if (!window.subsUp) startPlugin();

})();
