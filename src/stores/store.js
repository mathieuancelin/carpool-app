import moment from 'moment';
import Firebase from 'firebase';
import ActionTypes from '../actions/actiontypes';

const firebaseUrl = __FIREBASEURL__;

const defaultModel = {
  sessions: {
    'default': {
      users: {
        1: { id: '1', email: 'mathieu.ancelin@serli.com', name: 'Mathieu', score: 0.0 },
        2: { id: '2', email: 'mickael.boudaud@serli.com', name: 'Mickael', score: 0.0 },
        3: { id: '3', email: 'fedy.salah@serli.com', name: 'Fedy', score: 0.0 },
        4: { id: '4', email: 'lenn.angel@serli.com', name: 'Lenn', score: 0.0 },
      },
      archive: {
        '20151022': {
          '1': { role: 'passenger', was: 0.0 },
          '2': { role: 'driver', was: 0.0 },
          '3': { role: 'passenger', was: 0.0 },
          '4': { role: 'passenger', was: 0.0 },
        },
        '20151021': {
          '1': { role: 'passenger', was: 0.0 },
          '2': { role: 'passenger', was: 0.0 },
          '3': { role: 'driver', was: 0.0 },
          '4': { role: 'passenger', was: 0.0 },
        }
      }
    }
  }
};

function normalize(what) {
  return parseFloat(what.toFixed(3));
}

function notifyError(error) {
  // TODO : error notification
  console.error(error);
}

export default function Store(session) {
  let listeners = [];

  let currentUsers = {};
  let currentArchive = {};
  let currentDay = moment();

  const SessionRef = __DEV__
    ? new Firebase(`${firebaseUrl}/web/carpool/devsessions/${session}`)
    : new Firebase(`${firebaseUrl}/web/carpool/sessions/${session}`);
  const UsersRef = SessionRef.child('users');
  const ArchiveRef = SessionRef.child('archive');

  UsersRef.on('value', snapshot => {
    let value = snapshot.val();
    if (value === null) {
      UsersRef.set({...defaultModel.sessions.default.users});
    } else {
      currentUsers = value;
      notifyListeners();
    }
  }, notifyError);

  ArchiveRef.on('value', snapshot => {
    let value = snapshot.val();
    if (value !== null) {
      currentArchive = value;
      notifyListeners();
    }
  }, notifyError);


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

  function noDrivers(users) {
    for (let key in users) {
      const user = users[key];
      if (user === 'driver') {
        return false;
      }
    }
    return true;
  }

  function noPoolers(users) {
    for (let key in users) {
      const user = users[key];
      if (user === 'pooler') {
        return false;
      }
    }
    return true;
  }

  function decrement() {
    let value = Object.keys(currentUsers).length - 1;
    if (value <= 0) {
      value = 1;
    }
    return (1 / value);
  }

  function isLastSnapshot(date) {
    const today = moment(moment().format('YYYYMMDD'), 'YYYYMMDD');
    if (date.isAfter(today)) {
      return true;
    }
    let index = date;
    while (index.format('YYYYMMDD') !== today.format('YYYYMMDD')) {
      if (typeof currentArchive[index] !== 'unefined') {
        return false;
      }
      index = index.add(1, 'days');
    }
    return true;
  }

  function dispatch(action) {
    if (action.type === ActionTypes.PreviousDay) {
      previousDay();
    } else if (action.type === ActionTypes.NextDay) {
      nextDay();
    } else if (action.type === ActionTypes.UpdateDay) {
      const formattedDate = currentDay.format('YYYYMMDD');
      const DayArchivedRef = ArchiveRef.child(formattedDate);
      const day = {};
      const newUsers = {...currentUsers};
      const nbrUsers = Object.keys(newUsers).length;
      const nbrPoolers = nbrUsers - 1;
      if (noDrivers(action.payload.userStates)) {
        console.log('no driver');
        return;
      }
      if (noPoolers(action.payload.userStates)) {
        console.log('no poolers');
        return;
      }
      for (let key in newUsers) {
        const user = newUsers[key];
        const role = action.payload.userStates[user.id];
        const archived = currentArchive[formattedDate] || { [user.id]: {}};
        const userScore = isAlreadyValidated() ?
          (archived[user.id].was || 0.0) :
          (user.score || 0.0);
        day[user.id] = { was: userScore, role };
        if (role === 'driver') {
          user.score = normalize(userScore + 1);
        } else if (role === 'pooler') {
          user.score = normalize(userScore - decrement());
        }
      }
      DayArchivedRef.set(day);
      UsersRef.set(newUsers);
      if (!isLastSnapshot(currentDay)) {
        computeFromBeginning();
      }
    } else {
      console.log('Unknown action', action);
    }
  }

  function computeFromBeginning(cb = () => {}) {
    const users = {...currentUsers};
    const log = {...currentArchive};
    for (let key in users) {
      users[key].score = 0.0;
    }
    for (let key in log) {
      const value = log[key];
      for (let userId in value) {
        if (userId !== 'was') {
          const userAction = value[userId];
          value.was = normalize(users[userId].score);
          if (userAction.role === 'driver') {
            users[userId].score = normalize(users[userId].score + 1);
          } else if (userAction.role === 'pooler') {
            users[userId].score = normalize(users[userId].score - decrement());
          }
        }
      }
    }
    ArchiveRef.set(log, () => {
      UsersRef.set(users, () => {
        cb();
      });
    });
  }

  function isAlreadyValidated() {
    return typeof currentArchive[currentDay.format('YYYYMMDD')] !== 'undefined';
  }

  function previousDay() {
    const newDay = moment(currentDay).subtract(1, 'days');
    if (newDay.isBefore(moment('20151026', 'YYYYMMDD'))) {
      return;
    }
    if (newDay.weekday() == 5) {
      currentDay = newDay.subtract(1, 'days');
    } else if (newDay.weekday() == 6) {
      currentDay = newDay.subtract(2, 'days');
    } else {
      currentDay = newDay;
    }
    notifyListeners();
  }

  function nextDay() {
    const newDay = moment(currentDay).add(1, 'days');
    if (newDay.isAfter(moment().endOf('day'))) {
      return;
    }
    if (newDay.weekday() == 5) {
      currentDay = newDay.add(2, 'days');
    } else if (newDay.weekday() == 6) {
      currentDay = newDay.add(1, 'days');
    } else {
      currentDay = newDay;
    }
    notifyListeners();
  }

  return {
    subscribe,
    dispatch,
    computeFromBeginning,
    isAlreadyValidated,
    getCurrentDate() {
      return currentDay;
    },
    getUsers() {
      return {...currentUsers};
    },
    getArchives() {
      return {...currentArchive};
    },
    getArchivedDay(m) {
      return currentArchive[m.format('YYYYMMDD')];
    },
    getCurrentDayFromArchive() {
      return currentArchive[currentDay.format('YYYYMMDD')];
    },
    isInPast() {
      return currentDay.isBefore(moment().startOf('day'));
    }
  };
}
