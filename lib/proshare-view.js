'use babel';

export default class ProshareView {

  constructor(serializedState, parent) {

    this.element = document.createElement('div');
    this.element.classList.add('proshare');

    this.parent = parent;

    const loginContainer = this.getLoginDOM();

    this.element.appendChild(loginContainer);

    this.visible = true;
  }

  getLoginDOM(){

    const loginContainer = document.createElement('div');

    const loginText = document.createElement('h3');
    loginText.innerHTML = "Login";

    const username = document.createElement('input');

    username.classList.add("input");
    username.placeholder = "Zubatomic username";

    const password = document.createElement('input');

    password.type = "password";
    password.classList.add("input");
    password.placeholder = "Zubatomic password";

    const register = document.createElement('a');

    register.textContent = "Register instead";
    register.href = "http://zubatomic.es/userAPI/register";

    const error = document.createElement('div');

    error.textContent = "";
    error.classList.add("error");
    error.id = "proshare_error";

    const login = document.createElement('button');

    login.classList.add("button");
    login.textContent = "Login";
    login.style.marginBottom = "12px";

    let instance = this;

    login.onclick = evt => {

      instance.parent.sendRequest("noTrustLogin", {
        username: username.value,
        password: password.value,
      }, res => {

        instance.hideError();

        if(res == "no"){

          instance.showError("Invalid username or password");

        }else{

          instance.parent.loggedSession = res;
          instance.parent.loggedUsername = username.value;

          loginContainer.style.display = "none";

          instance.setupProjectsView();

        }

      });

    }

    loginContainer.appendChild(loginText);
    loginContainer.appendChild(username);
    loginContainer.appendChild(password);
    loginContainer.appendChild(error);
    loginContainer.appendChild(login);
    loginContainer.appendChild(register);

    return loginContainer;

  }

  setupProjectsView(){

    this.element.className = "";

    this.element.innerHTML = `<div style='font-size: 23px;'> Hello <a href='#' style='display: inline;'>${this.parent.loggedUsername}</a></div>`;

    let rlButton = document.createElement("BUTTON");

    rlButton.textContent = `Reload`;
    rlButton.classList.add("button");

    let instance = this;

    rlButton.onclick = () => {instance.setupProjectsView()};

    this.element.appendChild(rlButton);

    this.fetchProjects(this.showTreeView);

  }

  fetchProjects(callback){

    let instance = this;

    this.parent.sendRequestProshare("getProjects", {session: this.parent.loggedSession}, res => {

      if(res == "no"){

        instance.showError("Invalid session. Try restarting the Proshare package. If this issue continues to appear then ur actually retarded and ur hacking so fuck off");

      }else{

        callback(JSON.parse(res), instance);

      }

    });

  }

  showTreeView(projects, instance){

    instance.element.classList.add("uncentered");

    instance.element.classList.add("top-panel", "tree-view");
    instance.element.setAttribute("tabindex", -1);

    let bottomLevelWrapper = document.createElement("DIV");
    bottomLevelWrapper.classList.add("tree-view-root", "full-menu", "list-tree", "has-collapsable-children", "focusable-panel");

    let wrapper = document.createElement("LI");
    wrapper.classList.add("directory", "entry", "list-nested-item", "project-root", "expanded")

    let treeParent = document.createElement("OL");

    let lastSelected;

    for(let i in projects){

      let project = projects[i];

      let treeItem = document.createElement("LI");

      let projectFilesTree = document.createElement("OL");

      treeItem.classList.add("directory","entry","list-nested-item","collapsed");

      let toggleSelect = () => {
        if(lastSelected != null) lastSelected.classList.remove("selected");

        treeItem.classList.add("selected");

        lastSelected = treeItem;

        treeItem.classList.toggle("expanded");
        treeItem.classList.toggle("collapsed");
        projectFilesTree.classList.toggle("hidden");
      }

      treeItem.onclick = toggleSelect;

      setTimeout(toggleSelect, i * 300);
      setTimeout(toggleSelect, i * 300 + 200);

      treeItem.innerHTML = `
      <div class="header list-item">
        <span class="name icon icon-file-directory" title="${project.name}">${project.name}</span>
      </div>
      `;

      projectFilesTree.classList.add("entries", "list-tree", "hidden");

      for(let j in project.files){

        let file = project.files[j];

        let fileItem = document.createElement("LI");
        fileItem.classList.add("file","entry","list-item");

        fileItem.onclick = e => {

          e.stopPropagation();

          if(lastSelected != null) lastSelected.classList.remove("selected");

          fileItem.classList.add("selected");
          fileItem.focus();

          lastSelected = fileItem;

        }

        let tabView;

        fileItem.ondblclick = e => {

          let pane = atom.workspace.getPanes()[0];

          atom.workspace.open(`Proshare/${project.name}/${file.name+"."+file.fileType}`).then(textEditor => {

            window.textEditor = textEditor;

            textEditor.setText(file.content);
            textEditor.save()
            .then(() => {
              textEditor.onDidSave(e => {

                let text = textEditor.getText();

                let notification = atom.notifications.addInfo("Uploading to server...", {dismissable: true, icon: "flame"});

                instance.parent.sendRequestProshare("saveFromAtom", {
                  session: instance.parent.loggedSession,
                  text,
                  fileId: file.id,
                }, () => {

                  notification.dismiss();

                  atom.notifications.addSuccess("Uploaded to server successfully!", {icon: "rocket"});

                  file.content = text;

                });

              });

              textEditor.onDidDestroy(e => {

              });
            });

          });

        }

        fileItem.innerHTML = `
        <span class="name icon icon-file-text" title="${file.name+"."+file.fileType}" >${file.name+"."+file.fileType}</span>
        `;

        projectFilesTree.appendChild(fileItem);

      }

      treeItem.appendChild(projectFilesTree);

      treeParent.appendChild(treeItem);

    }

    let projectsHeader = document.createElement("DIV");

    projectsHeader.classList.add("header", "list-item", "project-root-header");

    projectsHeader.innerHTML = `
<span class="name icon icon-file-directory" title="Proshare">
  Proshare
</span>
    `;

    instance.element.appendChild(bottomLevelWrapper);
    bottomLevelWrapper.appendChild(wrapper);
    wrapper.appendChild(projectsHeader);
    wrapper.appendChild(treeParent);

  }

  showError(msg){

    let errorDOM = document.getElementById("proshare_error");

    errorDOM.style.display = "block";
    errorDOM.textContent = msg;

    setTimeout(() => {

      errorDOM.style.opacity = 1;

    }, 1);

  }

  hideError(){

    let errorDOM = document.getElementById("proshare_error");

    errorDOM.style.opacity = 0;

    setTimeout(() => {

      errorDOM.style.display = "none";

    }, 300);
  }

  getTitle(){

    return "Proshare";

  }

  isVisible(){

    return this.visible;

  }

  show(){

    this.visible = true;
    this.element.style.display = "";

  }

  hide(){

    this.visible = false;
    this.element.style.display = "none";

  }

  serialize() {}

  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
