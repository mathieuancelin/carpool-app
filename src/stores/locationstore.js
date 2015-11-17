import moment from 'moment';
import Firebase from 'firebase';
import ActionTypes from '../actions/actiontypes';

const firebaseUrl = __FIREBASEURL__;

function notifyError(error) {
  // TODO : error notification
  console.error(error);
}

export default function LocationStore(session) {
  let listeners = [];

  let currentTime = {};
  let currentLocation = {};
  let currentChanged = getLastUpdateFromLocalStorage();

  const SessionRef = __DEV__
    ? new Firebase(`${firebaseUrl}/web/carpool/devsessions/${session}`)
    : new Firebase(`${firebaseUrl}/web/carpool/sessions/${session}`);
  const LocationRef = SessionRef.child('location');

  LocationRef.on('value', snapshot => {
    let value = snapshot.val();
    if (value === null) {
      LocationRef.set({ location: 'SERLI', time: '07:53:00', changed: 0 });
    } else {
      currentTime = value.time;
      currentLocation = value.location;
      currentChanged = value.changed;
      notifyListeners();
    }
  }, notifyError);


  function getLastUpdateFromLocalStorage() {
    return parseInt(localStorage.getItem('lastUpdated') || '0');
  }

  function setLastUpdateFromLocalStorage(v) {
    localStorage.setItem('lastUpdated', v + '');
    notifyListeners();
  }

  function setNow() {
    setLastUpdateFromLocalStorage(currentChanged + 1);
  }

  function subscribe(listener) {
    listeners.push(listener);
    return () => {
      let index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  function notifyListeners() {
    listeners.forEach(cb => cb());
  }

  function dispatch(action) {
    if (action.type === ActionTypes.ChangeLocation) {
      LocationRef.set({ location: action.payload, time: currentTime, changed: currentChanged + 1 });
    } else if (action.type === ActionTypes.ChangeTime) {
      LocationRef.set({ location: currentLocation, time: action.payload, changed: currentChanged + 1 });
    } else {
      console.log('Unknown action', action);
    }
  }

  if (getLastUpdateFromLocalStorage() > 99999) {
    setLastUpdateFromLocalStorage(0);
  }

  return {
    subscribe,
    dispatch,
    getCurrentTime() {
      return currentTime;
    },
    getCurrentLocation() {
      return currentLocation;
    },
    setNow,
    hasChangedSinceLastTime() {
      return currentChanged > getLastUpdateFromLocalStorage();
    }
  };
}
