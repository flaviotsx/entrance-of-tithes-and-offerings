const electron = 	require('electron');
const url = 		require('url');
const path = 		require('path');
const fs = 			require('fs');
const os = 			require('os');
const PdfReader	=	require('pdfreader');

const {app, BrowserWindow, Menu, ipcMain, shell}	= electron;

process.env.NODE_ENV = 'development';

let mainWindow;
let addWindow;

// Listen for app to be ready
app.on('ready', function(){
	// Create a new window
	mainWindow = new BrowserWindow({});
	// Load HTML into window
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'mainWindow.html'),
		protocol: 'file:',
		slashes: true
	}));

	mainWindow.webContents.printToPDF(pdfSettings(), function(err, data) {
		if (err) {
			console.log(err);
			return;
		}
		try{
			ipcMain.on('item:add', (e, item) => 
			fs.writeFileSync('./generated_pdf.pdf', item));
			createPDFWindow();
		}catch(err){
			console.log('Unable to save ...');
		}
	   
	});

	// Quit app when closed
	mainWindow.on('closed', () => app.quit());

	// Build menu from Template
	const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	// Insert menu
	Menu.setApplicationMenu(mainMenu);
});

// Hendle createAddWindow

function createAddWindow(){
	addWindow = new BrowserWindow({
		width: 300,
		height: 400,
		title: 'Add Item'
	});

	addWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'addWindow.html'),
		protocol: 'file:',
		slashes: true
	}));

	addWindow.on('close', () => addWindow = null);
}

function createPDFWindow(){
	pdfWindow = new BrowserWindow({
		width: 800,
		height: 600,
		title: 'Report'
	});

	var pdfFile = new PdfReader().parseFileItems("./generated_pdf.pdf", function(err, item){
		if (err)
		  callback(err);
		else if (!item)
		  callback();
		else if (item.text)
		  console.log(item.text);
	});

	pdfWindow.loadURL(url.format({
		pathname: path.join(__dirname, ),
		protocol: 'file:',
		slashes: true
	}));

	pdfWindow.on('close', () => pdfWindow = null);
}

// Catch item:add
ipcMain.on('item:add', (e, item) => {
	mainWindow.webContents.send('item:add', item);
	addWindow.close();
});

// Create menu from Template
const mainMenuTemplate = [
	{
		label: 'File',
		submenu: [
			{
				label: 'Add Item',
				accelerator: process.platform == 'darwin' ? 'Command+N' : 'Ctrl+N',
				click(){
					createAddWindow();
				}
			},
			{
				label: 'Clear Items',
				click(){
					mainWindow.webContents.send('item:clear');
				}
			},
			{
				label: 'Quit',
				accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
				click(){
					app.quit();
				}
			}
		],
	}
];

// If mac, add empty object to menu

if(process.platform == 'darwin'){
	mainMenuTemplate.uinshift({});
}

// Add developer tools item if not in prod

if(process.env.NODE_ENV !== 'production') {
	mainMenuTemplate.push({
		label: 'Developer Tools',
		submenu:[
			{
				label: 'Toggle Devtools',
				accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
				click(item, focusedWindow){
					focusedWindow.toggleDevtools();
				}
			},
			{
				role: 'reload'
			}
		]
	});
}

// ipcMain.on('print-on-pdf', function(event){
// 	const pdfPath = path.join(os.tmpdir(), 'print.pdf');
// 	const win = mainWindow.fromWebContents(event.sender);

// 	win.webContents.printToPDF({}, function(error, data){
// 		if(error) return console.log(error.message);

// 		fs.writeFile(pdfPath, data, function(err){
// 			if(err) return console.log(err.message);
// 			shell.openExternal('file://' + pdfPath);
// 			event.sender.send('wrote-pdf', pdfPath);
// 		})
// 	})
// });


function pdfSettings() {
    var paperSizeArray = ["A4", "A5"];
    var option = {
        landscape: false,
        marginsType: 0,
        printBackground: false,
        printSelectionOnly: false,
        pageSize: paperSizeArray[0],
    };
  return option;
}