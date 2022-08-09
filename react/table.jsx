/* eslint-disable require-jsdoc */
import * as React from 'react';
import PropTypes from 'prop-types';

const colorMap = {
    'win': '#34eb92',
    'loss': '#ff6363',
};

const globalOpacity = 0.6;

const useSortedData = (battles, config = {key: null, direction: 'default'}) => {
    const [sortConfig, setSortConfig] = React.useState(config);
    console.log(battles);
    const sortedBattles = React.useMemo(() => {
        console.log(battles);
        if (sortConfig != null && sortConfig.key !== null) {
            if (sortConfig.direction !== 'default') {
                battles.sort((a, b) => {
                    // if either of the items is undefined, sort the undefined one to the end
                    if (a[sortConfig.key] === '' || b[sortConfig.key] === '') {
                        if (a[sortConfig.key] === '') return 1;
                        if (b[sortConfig.key] === '') return -1;
                    }

                    if (a[sortConfig.key] < b[sortConfig.key]) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (a[sortConfig.key] > b[sortConfig.key]) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                    return 0;
                });
            }
        }
        return battles;
    }, [battles, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'default';
        } else if (sortConfig.key === key && sortConfig.direction === 'default') {
            direction = 'ascending';
        }

        setSortConfig({
            key: key,
            direction: direction,
        });
        sortConfig.direction = direction;
    };

    return {
        sortedBattles: sortedBattles,
        sortConfig: sortConfig,
        requestSort,
    };
};


const BattleRow = (props) => {
    const {battle, isMobile} = props;

    let ratingText = <i
        style={{marginLeft: '5px'}}
        className={`fa-solid fa-minus`}
    />;

    if (battle.rating_before != '') {
        if (battle.rating_after == '' ) {
            ratingText = <span>{battle.rating_before}</span>;
        } else {
            ratingText = <span>{battle.rating_before}⭢{battle.rating_after}</span>;
        }
    }

    let oppRatingText = <i
        style={{marginLeft: '5px'}}
        className={`fa-solid fa-minus`}
    />;

    let teamMargin = '0px';
    if (isMobile) {
        teamMargin = '-20px';
    }

    if (battle.opponent_rating_before != '') {
        if (battle.opponent_rating_after == '' ) {
            oppRatingText = <span>{battle.opponent_rating_before}</span>;
        } else {
            oppRatingText = <span>{battle.opponent_rating_before}⭢{battle.opponent_rating_after}</span>;
        }
    }

    return (

        <tr key={battle.battle_id} data-id={battle.battle_id} style={{
        }}>
            <td>{new Date(battle.timestamp * 1000).toLocaleTimeString(
                [], {
                    year: 'numeric', month: 'numeric',
                    day: 'numeric', hour: '2-digit',
                    minute: '2-digit'},
            )}</td>

            <td>{ratingText}</td>

            <td>
                <div className="row" style={{marginLeft: teamMargin, alignContent: 'left', textAlign: 'left'}}>
                    {battle.your_team.split(',').map((mon) => {
                        const urlMon = mon.replace(' ', '%20');
                        const spanMon = mon.replace('-', '');
                        const background = Dex.getPokemonIcon(spanMon).split(':')[1];
                        const spanMonObj = <span
                            className="picon" style={{
                                background: background,
                                opactiy: 1,
                            }}>
                        </span>;
                        if (mon == 'random') {
                            return (
                                <div className="col-1" style={{marginRight: '5%', opacity: globalOpacity}}>
                                    {spanMonObj}
                                </div>
                            );
                        } else {
                            let opacity = 1;
                            if (!battle.selected.includes(mon)) {
                                opacity = globalOpacity;
                            }
                            const url = `https://pikalytics.com/pokedex/ss/${urlMon}`;
                            return (
                                <div className="col-1" style={{marginRight: '5%', opacity: opacity}}>
                                    <a target="_blank" href={url} rel="noreferrer">
                                        {spanMonObj}
                                    </a>
                                </div>
                            );
                        }
                    })}
                </div>
            </td>

            <td>
                <a target="_blank" style={{
                    textDecoration: 'none',
                    color: colorMap[battle.result],
                    fontWeight: 'bold',
                }}
                href={`${battle.replay}`} rel="noreferrer">
                    {battle.result.toUpperCase()}
                </a>
            </td>

            <td>
                <div className="row" style={{marginLeft: teamMargin, alignContent: 'left', textAlign: 'left'}}>
                    {battle.opponent_team.split(',').map((mon) => {
                        const urlMon = mon.replace(' ', '%20');
                        const spanMon = mon.replace('-', '');
                        const background = Dex.getPokemonIcon(spanMon).split(':')[1];
                        const spanMonObj = <span
                            className="picon" style={{
                                background: background,
                                opactiy: 1,
                            }}>
                        </span>;
                        if (mon == 'random') {
                            return (
                                <div className="col-1" style={{marginRight: '5%', opacity: globalOpacity}}>
                                    {spanMonObj}
                                </div>
                            );
                        } else {
                            let opacity = 1;
                            if (!battle.selected.includes(mon)) {
                                opacity = globalOpacity;
                            }
                            const url = `https://pikalytics.com/pokedex/ss/${urlMon}`;
                            return (
                                <div className="col-1" style={{marginRight: '5%', opacity: opacity}}>
                                    <a target="_blank" href={url} rel="noreferrer">
                                        {spanMonObj}
                                    </a>
                                </div>
                            );
                        }
                    })}
                </div>
            </td>

            <td>{oppRatingText}</td>

            <td>{battle.opponent}</td>

            <td>{battle.format}</td>

            <td style={{alignContent: 'center', textAlign: 'center'}}>
                <input style={{marginTop: '5px'}} type="checkbox"></input>
            </td>
        </tr>
    );
};

const BattlesTable = (props) => {
    const {battles, pageNumber, pageSize, isMobile} = props;
    const [stateBattles, setBattles] = React.useState(battles);
    React.useEffect(() => {
        setBattles(battles);
    }, [battles, stateBattles]);

    console.log(battles);

    const {sortedBattles, sortConfig, requestSort} = useSortedData(battles);
    if (battles.length === 0) {
        return <div/>;
    }

    const directionToClassMap = {
        'ascending': 'sort-asc',
        'descending': 'sort-desc',
        'default': 'sort',
        'null': 'minus',
    };


    let teamWidth = '225px';
    if (isMobile) {
        teamWidth = '85px';
    }

    return (
        <div className="rounded border border-light table-responsive" ref={(node) => {
            if (node) {
                node.style.setProperty('border-width', '2.5px', 'important');
            }
        }}>
            <table id="bt" className="table table-hover table-dark" style={{
                marginBottom: '0px', alignContent: 'center', textAlign: 'center'}}>
                <thead style={{borderTopColor: '#fff'}}>
                    <tr>
                        {/*
                        Headers are:
                        Date, Your Rating, Your Team, Result
                        Enemy Team, Enemy Rating, Enemy, Format, Select
                        */}
                        <th style={{width: '10%'}}>
                            <button
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'white', fontWeight: 'bold',
                                    border: 'none',
                                }}
                                type="button" onClick={() => requestSort('timestamp')}>
                                    Date
                                <i
                                    style={{marginLeft: '5px'}}
                                    className={`fa-solid fa-${
                                        sortConfig.key == null ||
                                            sortConfig.key === 'timestamp' ?
                                            directionToClassMap[sortConfig.direction] : 'minus'
                                    }`}
                                />
                            </button>
                        </th>

                        <th style={{width: '8%'}}>
                            <button
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'white', fontWeight: 'bold',
                                    border: 'none'}}
                                type="button" onClick={() => requestSort('rating_before')}>
                                    Your Rating
                                <i
                                    style={{marginLeft: '5px'}}
                                    className={`fa-solid fa-${
                                        sortConfig.key == null ||
                                            sortConfig.key === 'rating_before' ?
                                            directionToClassMap[sortConfig.direction] : 'minus'
                                    }`}
                                />
                            </button>
                        </th>

                        <th style={{width: '12%', minWidth: teamWidth, maxWidth: teamWidth}}>
                            <span style={{
                                color: 'white', fontWeight: 'bold',
                                border: 'none'}}>
                                    Your Team
                            </span>
                        </th>

                        <th style={{width: '7%'}}>
                            <button
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'white', fontWeight: 'bold',
                                    border: 'none'}}
                                type="button" onClick={() => requestSort('result')}>
                                Result
                                <i
                                    style={{marginLeft: '5px'}}
                                    className={`fa-solid fa-${
                                        sortConfig.key == null ||
                                            sortConfig.key === 'result' ?
                                            directionToClassMap[sortConfig.direction] : 'minus'
                                    }`}
                                />
                            </button>
                        </th>

                        <th style={{width: '12%', minWidth: teamWidth, maxWidth: teamWidth}}>
                            <span
                                style={{
                                    color: 'white', fontWeight: 'bold',
                                    border: 'none'}}>
                                    Opp Team
                            </span>
                        </th>

                        <th style={{width: '10%'}}>
                            <button
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'white', fontWeight: 'bold',
                                    border: 'none'}}
                                type="button" onClick={() => requestSort('opponent_rating_before')}>
                                Opp Rating
                                <i
                                    style={{marginLeft: '5px'}}
                                    className={`fa-solid fa-${
                                        sortConfig.key == null ||
                                             sortConfig.key === 'opponent_rating_before' ?
                                            directionToClassMap[sortConfig.direction] : 'minus'
                                    }`}
                                />
                            </button>
                        </th>

                        <th style={{width: '10%'}}>
                            <button
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'white', fontWeight: 'bold',
                                    border: 'none'}}
                                type="button" onClick={() => requestSort('opponent')}>
                                Opponent
                                <i
                                    style={{marginLeft: '5px'}}
                                    className={`fa-solid fa-${
                                        sortConfig.key == null ||
                                             sortConfig.key === 'opponent' ?
                                            directionToClassMap[sortConfig.direction] : 'minus'
                                    }`}
                                />
                            </button>
                        </th>

                        <th style={{width: '5%'}}>
                            <button
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'white', fontWeight: 'bold',
                                    border: 'none'}}
                                type="button" onClick={() => requestSort('format')}>
                                Format
                                <i
                                    style={{marginLeft: '5px'}}
                                    className={`fa-solid fa-${
                                        sortConfig.key == null ||
                                             sortConfig.key === 'format' ?
                                            directionToClassMap[sortConfig.direction] : 'minus'
                                    }`}
                                />
                            </button>
                        </th>

                        <th style={{width: '5%'}}>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedBattles.map((battle, i) => {
                        // only show the proper page of battles
                        return (i < pageNumber * pageSize && i >= (pageNumber - 1) * pageSize ?
                            <BattleRow key={battle.id} battle={battle} isMobile={isMobile} /> : null);
                    })}
                </tbody>
            </table >
        </div>
    );
};

BattlesTable.propTypes = {
    battles: PropTypes.array.isRequired,
    pageNumber: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
    isMobile: PropTypes.bool.isRequired,
};
BattleRow.propTypes = {
    key: PropTypes.string.isRequired,
    battle: PropTypes.object.isRequired,
    isMobile: PropTypes.bool.isRequired,
};
export default BattlesTable;
