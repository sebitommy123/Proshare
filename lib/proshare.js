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

    this.subscriptions = new CompositeDisposable();


    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'proshare:toggle': () => {
        this.setup(state);
      }
    }));
  },

  setup(state){

    let pane = atom.workspace.getPanes()[1];

    let treeviewPossibilities = pane.getItems().filter(a => a.constructor.name == "TreeView");

    let treeview;

    if(treeviewPossibilities.length > 0) treeview = treeviewPossibilities[0];

    if(!this.added && treeview != null){

      if(treeview.roots.length > 0){

        this.proshareView = new ProshareView(state.proshareViewState, this);
        pane.addItem(this.proshareView);

        this.added = true;

      }else{

        atom.notifications.addError("Please add at least one project folder before opening");

      }

    }else{

      atom.notifications.addError("Please open the Treeview package first");

    }

    if(treeview != null && treeview.roots.length > 0) pane.activateItem(this.proshareView);

  },

  deactivate() {
    this.subscriptions.dispose();
    this.proshareView.destroy();
    atom.workspace.getPanes()[1].destroyItem(this.proshareView);
    this.added = false;

  },

  serialize() {
    if(!this.proshareView) return {};
    return {
      proshareViewState: this.proshareView.serialize()
    };
  },

  sendRequestProshare(cmd, params, callback){

    var req = new XMLHttpRequest();

    let paramText = "";

    if(params != null){

      paramText = "&" + Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join("&");

    }

    req.onreadystatechange = e => {

        if(e.target.readyState == 4 && e.target.status == 200) {callback(req.responseText);}

    }

    req.open("POST", `http://zubatomic.es/projects/proshare/ajax.php`);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send(`cmd=${cmd}${paramText}`);

  },

  sendRequest(cmd, params, callback){

    var req = new XMLHttpRequest();

    let paramText = "";

    if(params != null){

      paramText = "&" + Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join("&");

    }

    req.onreadystatechange = e => {

        if(e.target.readyState == 4 && e.target.status == 200) {

          callback(req.responseText);

        }

    }

    req.open("POST", `http://zubatomic.es/userAPI/ajax.php`);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send(`cmd=${cmd}${paramText}`);

  },

};
