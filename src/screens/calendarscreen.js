import React from 'react';
import moment from 'moment';

export default React.createClass({
  componentWillUnmount() {
    this.cancelSubscription();
  },
  componentDidMount() {
    this.cancelSubscription = this.props.store.subscribe(this.update);
  },
  update() {
    this.forceUpdate();
  },
  findDriver(d, usersObj) {
    const users = Object.keys(d).map(k => Object.assign({}, d[k], { key: k }));
    const userId = users.filter(u => u.role === 'driver')[0];
    const solos = users.filter(u => u .role === 'solo').map(u => usersObj[u.key].name);
    if (userId) {
      if (solos.length > 0) {
        return d.date.format('DD/MM/YYYY') + ' - ' + usersObj[userId.key].name + ' (' + solos.join(', ') + ')';
      } else {
        return d.date.format('DD/MM/YYYY') + ' - ' + usersObj[userId.key].name;
      }
    }
    return d.date.format('DD/MM/YYYY') + ' - ' + 'Nobody';
  },
  render() {
    const users = this.props.store.getUsers();
    const archivesObj = this.props.store.getArchives();
    const archives = Object.keys(archivesObj).sort().reverse()
      .map(k => Object.assign({}, archivesObj[k], { date: moment(k, 'YYYYMMDD') }))
      .map(d => <li key={d.date.format('YYYYMMDD')} className="table-view-cell"
          style={{ backgroundColor: d.date.weekday() === 0 ? '#ECECEC' : 'white' }}>
          {this.findDriver(d, users)}</li>);
    return (
      <div>
        <header className="bar bar-nav">
          <h1 className="title">Carpooling Calendar</h1>
        </header>
        <div className="content">
          <ul className="table-view">{archives}</ul>
        </div>
      </div>
    );
  }
});
