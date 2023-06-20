let input = document.querySelector("#input");
let consoleDiv = document.querySelector("#console");
let commands;
let treeData;
let currentId = "0";
let path = [];
let svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    g = svg.append("g").attr("transform", "translate(40,0)");

Promise.all([
  fetch('cmds.yaml')
    .then(response => response.text())
    .then(data => {
      commands = jsyaml.safeLoad(data);
    }),
  fetch('tree.yaml')
    .then(response => response.text())
    .then(data => {
      treeData = jsyaml.safeLoad(data);
    }),
]).then(() => {
  consoleDiv.innerHTML += commands['help']; // Display help on start
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      let inputVal = input.value;
      consoleDiv.innerHTML += "> " + inputVal + "<br/>";
      if (inputVal in commands) {
        switch (inputVal) {
          case 'start':
            currentId = "0";
            path = [currentId];  // Start a new path
            consoleDiv.innerHTML += treeData[currentId].text + "<br/>";
            break;
          case 'clear':
            consoleDiv.innerHTML = "";
            break;
          case 'path':
            let canvas = document.querySelector("#canvas");
            if (getComputedStyle(canvas).display === "none") {
              consoleDiv.innerHTML += path.join(' -> ') + "<br/>";  // Print out the path
              canvas.style.display = "block";
              updateTree(); // Update tree when showing it
            } else {
              canvas.style.display = "none";
              svg.selectAll("*").remove(); // Clear the existing tree when hiding the canvas
            }
            break;
          case 'color':
            changeConsoleTextColor(inputVal);
            break;
          default:
            consoleDiv.innerHTML += commands[inputVal]; // Print command result
        }
      } else if (inputVal === "1" || inputVal === "2") {
        currentId = treeData[currentId]["option_" + inputVal];
        path.push(currentId);  // Add the new node to the path
        consoleDiv.innerHTML += treeData[currentId].text + "<br/>";
        svg.selectAll("*").remove();
        updateTree();
      }
      input.value = "";
    }
  });
  updateTree(); // Call updateTree here after loading data and setting up event listener
});

function updateTree() {
  let nodes = Object.keys(treeData).map(id => ({ id, ...treeData[id] }));
  let links = [];
  nodes.forEach((node) => {
    if (node.option_1) links.push({ source: node.id, target: node.option_1 });
    if (node.option_2) links.push({ source: node.id, target: node.option_2 });
  });

  // Here, we're moving the hierarchy creation and tree layout to this function
  let treeLayout = d3.tree().size([height, width - 160]);
  let root = d3.hierarchy(nodes.find(n => n.id === "0"), d => nodes.filter(n => d.id === n.option_1 || d.id === n.option_2));
  let tree = treeLayout(root);

  //... rest of the code ...  
  let link = g.selectAll(".link")
    .data(tree.links())
    .enter().append("path")
    .attr("class", "link")
    .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));
  let node = g.selectAll(".node")
    .data(tree.descendants())
    .enter().append("g")
    .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
    .attr("transform", d => `translate(${d.y},${d.x})`);
  node.append("circle")
    .attr("r", 10)
    .attr("fill", d => d.data.id === currentId ? "lime" : "darkgreen");
  node.append("text")
    .attr("dy", ".35em")
    .attr("y", d => d.children ? -20 : 20)
    .style("text-anchor", "middle")
    .text(d => d.data.id);
}

function changeConsoleTextColor(inputVal) {
    const colors = inputVal.split(" ");
    if (colors.length === 2) {
      const color = colors[1].trim().toLowerCase();
      const consoleDiv = document.querySelector("#console");
      const inputWrapper = document.querySelector(".input-wrapper");
      const body = document.querySelector("body");
  
      consoleDiv.style.color = color;
      inputWrapper.style.color = color;
      body.style.color = color;
    } else {
      consoleDiv.innerHTML += "Invalid color command. Usage: 'color <color>'<br/>";
    }
  }
  