'use babel';

import ProshareView from './proshare-view';
import { CompositeDisposable } from 'atom';

export default {

  proshareView: null,
  modalPanel: null,
  subscriptions: null,
  added: false,
  loggedSession: "",

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'proshare:toggle': () => {
        this.setup(state);
      }
    }));
  },

  setup(state){

    let pane = atom.workspace.getPanes()[1];

    if(!this.added){

      this.proshareView = new ProshareView(state.proshareViewState, this);
      pane.addItem(this.proshareView);

      this.added = true;

    }

    pane.activateItem(this.proshareView);

  },

  deactivate() {
    this.subscriptions.dispose();
    this.proshareView.destroy();
    atom.workspace.getPanes()[1].destroyItem(this.proshareView);
    this.added = false;

  },

  serialize() {
    return {
      proshareViewState: this.proshareView.serialize()
    };
  },

  sendRequestProshare(cmd, params, callback){

    var req = new XMLHttpRequest();

    let paramText = "";

    if(params != null){

      paramText = "&" + Object.keys(params).map(key => `${key}=${params[key]}`).join("&");

    }

    // log(`Sending a message: cmd=${cmd}${paramText}`);

    req.onreadystatechange = e => {

        if(e.target.readyState == 4 && e.target.status == 200) {callback(req.responseText);}

    }

    req.open("POST", `http://zubatomic.es/projects/proshare/ajax.php`);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send(`cmd=${cmd}${paramText}`);
    // req.open("GET", "https://www.tutorialspoint.com/ http/http_responses.htm");

  },

  sendRequest(cmd, params, callback){

    var req = new XMLHttpRequest();

    let paramText = "";

    if(params != null){

      paramText = "&" + Object.keys(params).map(key => `${key}=${params[key]}`).join("&");

    }

    // log(`Sending a message: cmd=${cmd}${paramText}`);

    req.onreadystatechange = e => {

        if(e.target.readyState == 4 && e.target.status == 200) {

          callback(req.responseText);

        }

    }

    req.open("POST", `http://zubatomic.es/userAPI/ajax.php`);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send(`cmd=${cmd}${paramText}`);
    // req.open("GET", "https://www.tutorialspoint.com/ http/http_responses.htm");

  },

};
