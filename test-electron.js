const { app } = require('electron');
console.log('App object:', typeof app);
if (app) {
    console.log('App exists');
    process.exit(0);
} else {
    console.log('App is undefined');
    process.exit(1);
}
