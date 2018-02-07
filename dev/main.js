let currentPlayer;
window.onload = () => {

  Array.from(document.getElementsByClassName('js-nav')).map( (element) => {
    element.onclick = () => {
      activateElement('js-nav', element.id);
    }
  });

  document.getElementById('update-games').onclick = () => {
    getGames();
  };

  ['share-app', 'streams-share-channel', 'clips-share-channel'].map( (elementId) => {
    let element = document.getElementById(elementId);
    element.onclick = () => tweetThis.call(element);
  });

  getGames();

}

function activateElement(type, id){
  switch(type){
    case 'js-nav':
      let navElement = document.getElementById(id);
      navElement.parentElement.querySelector('.js-nav.active').classList.remove('active');
      navElement.classList.add('active');
      switchSection(id);
      break;

    case 'js-nav-section':
      let navSectionElement = document.getElementById(id);
      navSectionElement.parentElement.querySelector('.js-nav-section.active').classList.replace('active', 'hide');
      navSectionElement.classList.replace('hide','active');
      activateElement('js-player', navSectionElement.querySelector('.js-player').id);
      break;

    case 'js-player-section':
      let playerSectionElement = document.getElementById(id);
      playerSectionElement.parentElement.querySelector('.js-player-section.active').classList.replace('active', 'hide');
      playerSectionElement.classList.replace('hide','active');
      break;

    case 'js-video':
      let videoElement = id;
      videoElement.parentElement.querySelector('.js-video.active').classList.remove('active');
      videoElement.classList.add('active');

      if (videoElement.parentElement.id === 'streams-playlist'){
        activateElement('js-player', 'streams-player');
      }else{
        activateElement('js-player', 'clips-player');
      }
      break;

    case 'js-player':
      if(currentPlayer) currentPlayer.pause();
      currentPlayer = playVideo.call({player_id: id});
      break;

    default: throw `Unidentified type =${type}.`;
  }
}

function switchSection(id){
  switch (id) {
    case 'nav-item-games':
      activateElement('js-nav-section', 'games');
      break;

    case 'nav-item-streams':
      activateElement('js-nav-section','streams');
      break;

    case 'nav-item-clips':
      activateElement('js-nav-section','clips');
      break;

    case 'nav-item-playlist':
      activateElement('js-player-section','streams-playlist');
      break;

    case 'nav-item-chat':
      activateElement('js-player-section','streams-chat');
      break;

    default: throw `No section element with ${id}`;
  }
}

function getGames(){
  let grid = document.querySelector('.js-games-grid');
  grid.innerHTML='';
  let url = 'https://api.twitch.tv/kraken/games/top?limit=50';

  apiGetRequest(url, function(){
    let json = JSON.parse(this.responseText);
    json.top.map((game, idx) => {
      grid.innerHTML+='<img src="'+ game.game.box.large +'" class="games-grid_card js-game-card" data-id="'+ game.game.name +'">';
    });

    Array.from(document.getElementsByClassName('js-game-card')).map( (game) => {
      game.onclick = () => {
        Array.from(document.getElementsByClassName('js-nav-section')).map( el => el.classList.remove('blank'));
        document.getElementById('nav-item-streams').click();
        let id = game.getAttribute('data-id');
        document.querySelector('.streams-header_game').textContent = id;
        document.querySelector('.clips-header_game').textContent = id;
        getStreams.call({game: id});
        getClips.call({game: id, period: 'week'});

      }
    });

  });

}

function getStreams(){
  let playlist = document.getElementById('streams-playlist');
  playlist.innerHTML='';
  let url = `https://api.twitch.tv/kraken/streams/?game=${this.game}&limit=100&stream_type=live`;

  apiGetRequest(url, function(){
    let json = JSON.parse(this.responseText);
    json.streams.filter((stream) => {
      if (stream.channel.broadcaster_language === "en" && stream.channel.language === "en"){
        return true;
      }
      return false;

    }).slice(0,10).map((stream) => {
      playlist.innerHTML+= renderPlaylistVideo.call(stream, 'stream');
    });

    let videos = Array.from(document.getElementById('streams-playlist').getElementsByClassName('js-video'));
    videos.map( (el) => {
      el.onclick = () => {
        activateElement('js-video', el);
      }
    });
    videos[0].classList.add('active');
    activateElement('js-player', 'streams-player');

  });


  // apiRequest(url).then((json) => {
  //   json.streams.filter((stream) => {
  //     if (stream.channel.broadcaster_language === "en" && stream.channel.language === "en"){
  //       return true;
  //     }
  //     return false;
  //
  //   }).slice(0,10).map((stream) => {
  //     playlist.innerHTML+= renderPlaylistVideo.call(stream, 'stream');
  //   });
  //
  // }).then(() =>{
  //   let videos = Array.from(document.getElementById('streams-playlist').getElementsByClassName('js-video'));
  //   videos.map( (el) => {
  //     el.onclick = () => {
  //       activateElement('js-video', el);
  //     }
  //   });
  //   videos[0].classList.add('active');
  //   activateElement('js-player', 'streams-player');
  // }).catch((err) =>{
  //   console.log(err);
  // });
}

function getClips(){
  let playlist = document.getElementById('clips-playlist');
  playlist.innerHTML='';
  let url = `https://api.twitch.tv/kraken/clips/top?game=${this.game}&period=${this.period}&limit=10&language=en`;

  apiGetRequest(url, function(){
    let json = JSON.parse(this.responseText);
    json.clips.map( (clip) => {
      playlist.innerHTML+= renderPlaylistVideo.call(clip, 'clip');
    });

    let videos = Array.from(document.getElementById('clips-playlist').getElementsByClassName('js-video'));
    videos.map( (el) => {
      el.onclick = () => {
        activateElement('js-video', el);
      }
    });
    videos[0].classList.add('active');
    activateElement('js-player', 'clips-player');

  });

}

function playVideo(){
  let player  = document.getElementById(this.player_id);
  player.innerHTML='';
  let video;
  let options;
  switch(this.player_id){
    case 'streams-player':
      video = document.getElementById('streams-playlist').querySelector('.js-video.active');
      if(video){
        options = {
          channel: video.getAttribute('data-id')
        };
        document.getElementById('streams-chat').innerHTML = '<iframe id="'+video.getAttribute('data-id')+'" height="100%" width="100%" frameborder="0" scrolling="yes" src="https://www.twitch.tv/'+video.getAttribute('data-id')+'/chat"></iframe>';
      }

      break;

    case 'clips-player':
      video = document.getElementById('clips-playlist').querySelector('.js-video.active');
      if(video){
        options = {
          video: video.getAttribute('data-id')
        };
      }
      break;

    default: throw 'Must specify type of video (stream or clip) for playVideo function.';
  }

  if(options){
    renderCurrentVideoInfo(this.player_id, video);
    player = new Twitch.Player(this.player_id, options);
    player.pause();
    player.play();
    player.setVolume(0.5);
    return player;
  }
}

function renderPlaylistVideo(type){
  if (type === 'stream'){
    return `
    <div class="playlist-video js-video"
         data-id=${this.channel.name}
         data-display-id=${this.channel.display_name}
         data-url=${this.channel.url}
         data-title="${this.channel.status}"
         data-followers=${this.channel.followers}
         data-logo=${this.channel.logo} >

      <img src=${this.preview.large} alt="" class="playlist-video_thumbnail">
      <div class="playlist-video_content">
        <p class="playlist-video-title">${this.channel.status}</p>
        <div class="playlist-video-meta">
          <span class="playlist-video-channel">${this.channel.display_name}</span>
          <span class="playlist-video-viewers">${this.viewers} Viewers</span>
        </div>
      </div>
    </div>
    `;

  }else if(type === 'clip'){
    return `
    <div class="playlist-video js-video"
         data-id=${this.vod.id}
         data-display-id=${this.broadcaster.display_name}
         data-url=${this.broadcaster.channel_url}
         data-title="${this.title}"
         data-logo=${this.broadcaster.logo} >

      <img src=${this.thumbnails.medium} alt="" class="playlist-video_thumbnail">
      <div class="playlist-video_content">
        <p class="playlist-video-title">${this.title}</p>
        <div class="playlist-video-meta">
          <span class="playlist-video-channel">${this.broadcaster.display_name}</span>
          <span class="playlist-video-viewers">${this.views} Views</span>
        </div>
      </div>
    </div>
    `;
  }else{
    throw 'Type "streams" or "clips" must be specified to render playlist videos.'
  }
}

function renderCurrentVideoInfo(player_id, video){
  let info = document.getElementById(player_id).nextElementSibling;
  info.querySelector('.player-title').textContent = video.getAttribute('data-title');
  info.querySelector('.player-channel-icon').firstElementChild.setAttribute('src',video.getAttribute('data-logo'));
  info.querySelector('.player-channel-name').textContent = video.getAttribute('data-display-id');
  info.querySelectorAll('.btn-link')[0].setAttribute('data-channel-name', video.getAttribute('data-display-id'));
  info.querySelectorAll('.btn-link')[0].setAttribute('data-channel-url', video.getAttribute('data-url'));
  info.querySelectorAll('.btn-link')[1].setAttribute('href', video.getAttribute('data-url'));
  if (player_id === 'streams-player'){
    info.querySelectorAll('.btn_text')[2].textContent = formatPersonCount(video.getAttribute('data-followers'));
  }
}

function formatPersonCount(val){
  let x =  Number.parseFloat(val);
  let helper = function(value, exp){
    value = +value;
    exp = +exp;
    // Shift
    value = value.toString().split('e');
    value = Math['round'](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  if(x < 1000){
    return x;
  }else if(x >= 1000 && x < 1000000){
    return helper(x/1000, -1).toString() + 'K';
  }else{
    return helper(x/1000000, -1).toString() + 'M';
  }
}

function tweetThis(){
  switch(this.id){

    case 'streams-share-channel':
    case 'clips-share-channel':
    let requestUrl = 'https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDlaUZKR_p0xJTIZ1aQt5uH9oPYDzGn4Uc';
    let paramUrl = this.getAttribute('data-channel-url');

    postApiRequest.call({contentType: 'application/json', payload: {longUrl : paramUrl}}, requestUrl, function(){
      let json = JSON.parse(this.responseText);
      let name = this.getAttribute('data-channel-name').toUpperCase();
      let text = `Give ${name} a try on Twitch. Quite Entertaining!`;
      window.open('http://twitter.com/share?url='+encodeURIComponent(json.id)+'&text='+encodeURIComponent(text), '', 'left=0,top=0,width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0');

    });
    // fetch(requestUrl, {
    //   method: 'POST',
    //   headers: new Headers({
    //     'Content-Type': 'application/json'
    //   }),
    //   body: JSON.stringify({longUrl : paramUrl})
    // }).then( res => res.json() ).then( (res) => {
    //   let name = this.getAttribute('data-channel-name').toUpperCase();
    //   let text = `Give ${name} a try on Twitch. Quite Entertaining!`;
    //   window.open('http://twitter.com/share?url='+encodeURIComponent(res.id)+'&text='+encodeURIComponent(text), '', 'left=0,top=0,width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0');
    //
    // });
    break;

    case 'share-app':
    let url = this.getAttribute('data-app-url');
    let name = this.getAttribute('data-app-name');
    let text = `Check out this ${name} for  (mostly) English-only Top Live Streams and Clips. Great for discovering some new streamers of top games on Twitch.`;
    window.open('http://twitter.com/share?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(text), '', 'left=0,top=0,width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0');

    break;

    default:
    console.log('Wait! what?! which TWEET button did you click!');
  }
}

function xhrSuccess() {
  if (this.readyState === 4) {
    if (this.status === 200) {
      this.callback.apply(this);
    } else {
      console.error(xhr.statusText);
    }
  }
}


function xhrError() {
    console.error(this.statusText);
}

function apiGetRequest(url, callback) {
    let xhr = new XMLHttpRequest();

    xhr.callback = callback;
    xhr.onload = xhrSuccess;
    xhr.onerror = xhrError;
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Accept','application/vnd.twitchtv.v5+json');
    xhr.setRequestHeader('Client-ID','quj90wdz8sgsc3o5rfq1evnrjomzfs');
    xhr.send(null);
}


function postApiRequest(url, callback){
  let xhr =  new XMLHttpRequest;

  xhr.callback = callback;
  xhr.arguments = Array.prototype.slice.call(arguments, 2);
  xhr.onload = xhrSuccess;
  xhr.onerror = xhrError;
  xhr.open("POST", url, true);
  if(this.contentType) xhr.setRequestHeader('Content-Type', this.contentType);
  if(this.accept)  xhr.setRequestHeader('Accept', this.accept);
  xhr.send(JSON.stringify(this.payload));
}
