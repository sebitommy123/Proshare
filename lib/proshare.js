'use babel';

import ProshareView from './proshare-view';
import { CompositeDisposable } from 'atom';

export default {

  proshareView: null,
  modalPanel: null,
  subscriptions: null,
  added: false,
  loggedSession: "",
  ongoingContextmenu: {},

  activate(state) {

    this.subscriptions = new CompositeDisposable();


    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'proshare:toggle': () => {
        this.setup(state);
      },
      'proshare:runProject': () => {
        let e = this.ongoingContextmenu["runProject"];
        let elm = e.target;
        while(elm.getAttribute("id") == null) elm = elm.parentElement;
        let id = elm.getAttribute("id");
        let url = "http://zubatomic.es/projects/proshare/domains/" + id + "?session=" + this.loggedSession;

        window.open();

        setTimeout(() => {
          var remote = require("remote");
          var BrowserWindow = remote.BrowserWindow;
          var windows = BrowserWindow.getAllWindows();

          let w = windows[windows.length-1];

          w.openDevTools();
          w.maximize();

          w.loadURL(url);

        }, 100);
      },
      'proshare:newFolder': () => {

        let box = document.createElement("atom-panel");
        box.classList.add("modal", "overlay", "from-top");

        box.onclick = evt => {
          box.parentElement.removeChild(box);
        };

        box.innerHTML = `
        <div class="tree-view-dialog">
          <label class="icon">Name:</label>
          <atom-text-editor id='create_project_name' class="editor mini has-selection" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" tabindex="-1"></atom-text-editor>
          <label class="icon">Language:</label>
          <select id='create_project_language' class='generic_select'>
            <option value='3'>Canvas (JavaScript)</option>
            <option value='2'>Web</option>
          </select>
          <br><br>
          <button class='button' id='create_project_button'>Create project</button>
          <div class="error-message">
          </div>
        </div>
        `;
        box.children[0].onclick = evt => {
          evt.stopPropagation();
        };

        document.body.children[0].insertBefore(box, document.body.children[0].children[0]);

        let instance = this;

        let create_project_button = document.getElementById("create_project_button");
        create_project_button.onclick = () => {

          let create_project_name = document.getElementById("create_project_name");
          let create_project_language = document.getElementById("create_project_language");

          let name = create_project_name.getModel().getText();
          let language = create_project_language.value;

          instance.sendRequestProshare("addProject", {session: instance.loggedSession, name, language, type: "Random / Other"}, res => {

            atom.notifications.addSuccess(`New project "${name}" successfully created!`);

            instance.proshareView.setupProjectsView();

            box.parentElement.removeChild(box);

          });

        };


      },
      'proshare:changeFileType': () => {

          let e = this.ongoingContextmenu["changeFileType"];
          let elm = e.target;
          while(elm.getAttribute("fileId") == null) elm = elm.parentElement;
          let fileId = elm.getAttribute("fileId");
          let projectLanguage = elm.getAttribute("projectLanguage");
          let fileType = elm.getAttribute("fileType");

          console.log(elm, projectLanguage);

          let box = document.createElement("atom-panel");
          box.classList.add("modal", "overlay", "from-top");

          box.onclick = evt => {
            box.parentElement.removeChild(box);
          };

          let options = "";

          if(projectLanguage == "Web") {  //web

            options = `
            <option value='css'>.css</option>
            <option value='js'>.js</option>
            <option value='html'>.html</option>
            `;

            if(fileType == "js"){
              options = `
              <option value='js'>.js</option>
              <option value='html'>.html</option>
              <option value='css'>.css</option>
              `;
            }

            if(fileType == "html"){
              options = `
              <option value='html'>.html</option>
              <option value='js'>.js</option>
              <option value='css'>.css</option>
              `;
            }

          }

          box.innerHTML = `
          <div class="tree-view-dialog">
            <label class="icon">New language:</label>
            <select id='change_file_type' class='generic_select'>
            ${options}
            </select>
            <br><br>
            <button class='button' id='change_file_type_button'>Change language</button>
            <div class="error-message">
            </div>
          </div>
          `;
          box.children[0].onclick = evt => {
            evt.stopPropagation();
          };

          document.body.children[0].insertBefore(box, document.body.children[0].children[0]);

          let instance = this;

          let change_file_type_button = document.getElementById("change_file_type_button");
          change_file_type_button.onclick = () => {

            let change_file_type = document.getElementById("change_file_type");

            let new_file_type = change_file_type.value;

            instance.sendRequestProshare("updateFileType", {session: instance.loggedSession, fileId, fileType: new_file_type}, res => {

              instance.proshareView.setupProjectsView();

              box.parentElement.removeChild(box);

            });

          };
      },
      'proshare:newFile': () => {

        let e = this.ongoingContextmenu["newFile"];
        let elm = e.target;
        while(elm.getAttribute("id") == null) elm = elm.parentElement;
        let projectId = elm.getAttribute("id");

        let box = document.createElement("atom-panel");
        box.classList.add("modal", "overlay", "from-top");

        box.onclick = evt => {
          box.parentElement.removeChild(box);
        };

        box.innerHTML = `
        <div class="tree-view-dialog">
          <label class="icon">File name:</label>
          <atom-text-editor id='fileName' class="editor mini has-selection" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" tabindex="-1"></atom-text-editor>
          <br><br>
          <button class='button' id='add_file_button'>Add file</button>
          <div class="error-message">
          </div>
        </div>
        `;
        box.children[0].onclick = evt => {
          evt.stopPropagation();
        };

        document.body.children[0].insertBefore(box, document.body.children[0].children[0]);

        let instance = this;

        let add_file_button = document.getElementById("add_file_button");
        add_file_button.onclick = () => {

          let fileName = document.getElementById("fileName");

          let name = fileName.getModel().getText();

          instance.sendRequestProshare("addFile", {session: instance.loggedSession, fileName: name, content: "", fileType: "js", projectId}, res => {

            atom.notifications.addSuccess(`New file "${name}" successfully created!`);

            instance.proshareView.setupProjectsView();

            box.parentElement.removeChild(box);

          });

        };
      },
      'proshare:rename': () => {

        let e = this.ongoingContextmenu["rename"];
        let elm = e.target;

        let type;

        let overflow = 0;

        while(overflow < 10){

          if(elm.getAttribute("fileId") != null){
            type = "file";
            break;
          }

          if(elm.getAttribute("id") != null){
            type = "project";
            break;
          }

          elm = elm.parentElement;

          overflow++;

        }

        let id;

        if(type == "file"){

          id = elm.getAttribute("fileId");

        }else{

          id = elm.getAttribute("id");

        }

        let box = document.createElement("atom-panel");
        box.classList.add("modal", "overlay", "from-top");

        box.onclick = evt => {
          box.parentElement.removeChild(box);
        };

        let currentName = elm.getAttribute(`${type}Name`);

        box.innerHTML = `
        <div class="tree-view-dialog">
          <label class="icon">New ${type} name:</label>
          <atom-text-editor id='newName' class="editor mini has-selection" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" tabindex="-1" value="${currentName}"></atom-text-editor>
          <br><br>
          <button class='button' id='rename_button'>Rename</button>
          <div class="error-message">
          </div>
        </div>
        `;

          box.children[0].onclick = evt => {
            evt.stopPropagation();
          };

          document.body.children[0].insertBefore(box, document.body.children[0].children[0]);

          let instance = this;

          let rename_button = document.getElementById("rename_button");
          rename_button.onclick = () => {

            let newName = document.getElementById("newName");

            let name = newName.getModel().getText();

            let res = res => {

              atom.notifications.addSuccess(`The ${type} has been successfully renamed to ${name}.`);

              instance.proshareView.setupProjectsView();

              box.parentElement.removeChild(box);

            };

            /*
            changeName (newName, projectId)
            updateFileName (fileId, projectId, fileName)
            */

            if(type == "project"){

              let params = {
                session: instance.loggedSession,
                newName: name,
                projectId: id
              };

              instance.sendRequestProshare("changeName", params, res);

            }

            if(type == "file"){

              let params = {
                session: instance.loggedSession,
                fileName: name,
                projectId: elm.getAttribute("projectId"),
                fileId: id
              };

              instance.sendRequestProshare("updateFileName", params, res);

            }


          };

      },
      'proshare:delete': () => {

          let e = this.ongoingContextmenu["delete"];
          let elm = e.target;

          let type;

          let overflow = 0;

          while(overflow < 10){

            if(elm.getAttribute("fileId") != null){
              type = "file";
              break;
            }

            if(elm.getAttribute("id") != null){
              type = "project";
              break;
            }

            elm = elm.parentElement;

            overflow++;

          }

          let id;

          if(type == "file"){

            id = elm.getAttribute("fileId");

          }else{

            id = elm.getAttribute("id");

          }

          if(!confirm(`Are you sure you want to delete this ${type}?`)){
            return;
          }

          let instance = this;

          let res = res => {

            atom.notifications.addSuccess(`The ${type} has been deleted.`);

            instance.proshareView.setupProjectsView();

          };

          if(type == "project"){

            let params = {
              session: instance.loggedSession,
              projectId: id
            };


            instance.sendRequestProshare("deleteProject", params, res);

          }

          if(type == "file"){

            let params = {
              session: instance.loggedSession,
              projectId: elm.getAttribute("projectId"),
              fileId: id
            };

            instance.sendRequestProshare("removeFile", params, res);

          }

      },
    }));
  },

  dialogBox(name){

    let box = document.createElement("atom-panel");
    box.classList.add("modal", "overlay", "from-top");

    box.onclick = evt => {
      evt.stopPropagation();
    };

    box.innerHTML = `
    <div class="tree-view-dialog">
      <label class="icon icon-arrow-right">${name}</label>
      <atom-text-editor class="editor mini has-selection" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" tabindex="-1"></atom-text-editor>
      <div class="error-message">
      </div>
    </div>
    `;

    document.body.insertBefore(box, document.body.children[0]);

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
