// Firebase compatibility shim - provides global firebase object for legacy code
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

// Make firebase available globally (for now, until we refactor)
window.firebase = firebase;

export default firebase;
