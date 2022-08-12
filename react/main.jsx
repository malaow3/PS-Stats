import axios from 'axios';
import $ from 'jquery'; // eslint-disable-line no-unused-vars
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import BattlesTable from './table.jsx';

const e = React.createElement;
const doneTypingInterval = 500; // time in ms, 5 seconds for example

// eslint-disable-next-line require-jsdoc
function debounce(fn, ms) {
    let timer;
    return (_) => {
        clearTimeout(timer);
        timer = setTimeout((_) => {
            timer = null;
            // eslint-disable-next-line no-invalid-this, prefer-rest-params
            fn.apply(this, arguments);
        }, ms);
    };
}

/**
 * Determine if a user agent is for mobile device
 * @return {boolean}
 */
function isMobile() {
    let check = false;
    (function(a) {
        // eslint-disable-next-line max-len
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

const pageSize = 8;
/**
 * Class for page content
 */
class Main extends React.Component {
    /**
     * Create an instance of the Class
     * @param {Object} props
     */
    constructor(props) {
        super(props);
        this.state = {
            isLoggedIn: false,
            username: null,
            battles: [],
            filter_battles: [],
            sortDirection: 'default',
            sort_field: null,
            sort_class: 'sort',
            page: 1,
            totalPages: 1,
            pageSize: pageSize,
            isMobile: isMobile() || window.innerWidth < 1200,
        };

        if (this.state.isMobile) {
            this.state.pageSize = 4;
        }

        // bind triggerLoginModal to this
        this.triggerLoginModal = this.triggerLoginModal.bind(this);
        // bind processLogin to this
        this.processLogin = this.processLogin.bind(this);
        this.deleteEntries = this.deleteEntries.bind(this);
        this.filterBattles = this.filterBattles.bind(this);
    }

    /**
     * Filter battles when typing stops or user presses enter
     * @param {Object | str} event
     */
    filterBattles(event) {
        // if the event is enter key

        const filterTagsRegex = /(\w*:[\S]*)/gm;

        if (event.keyCode === 13 || event == 'TYPINGTIMEOUT') {
            // get the content of the filter search
            let filterContent = document.getElementById('filter').value;
            console.log(filterContent);
            // filter battles based on opponent name, opponent team, or your team

            const filterInfo = {
                opponent_name: null,
                opponent_team: null,
                your_team: null,
                format: null,
            };
            let m;
            while ((m = filterTagsRegex.exec(filterContent)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === filterTagsRegex.lastIndex) {
                    filterTagsRegex.lastIndex++;
                }

                // The result can be accessed through the `m`-variable.
                m.forEach((match, _) => {
                    console.log('match: ' + match);
                    if (match.startsWith('opponent:')) {
                        filterInfo.opponent_name = match.replace('opponent:', '');
                    } else if (match.startsWith('opponent_team:')) {
                        filterInfo.opponent_team = match.replace('opponent_team:', '');
                    } else if (match.startsWith('your_team:')) {
                        filterInfo.your_team = match.replace('your_team:', '');
                    } else if (match.startsWith('format:')) {
                        filterInfo.format = match.replace('format:', '');
                    }
                });
            }

            console.log(filterInfo);

            let filteredBattles = new Set();
            const formatBattles = new Set();
            const opponentBattles = new Set();
            const opponentTeamBattles = new Set();
            const yourTeamBattles = new Set();
            if (filterInfo.opponent_name != null) {
                const tempBattles = this.state.battles.filter((battle) => {
                    return battle.opponent.toLowerCase().includes(filterInfo.opponent_name.toLowerCase());
                });
                tempBattles.forEach((item) => opponentBattles.add(item));
                // remove the content from the filter search
                filterContent = filterContent.replace(`opponent:${filterInfo.opponent_name}`, '');
            }
            if (filterInfo.opponent_team != null) {
                const tempBattles = this.state.battles.filter((battle) => {
                    return battle.opponent_team.toLowerCase().includes(filterInfo.opponent_team.toLowerCase());
                });
                tempBattles.forEach((item) => opponentTeamBattles.add(item));
                filterContent = filterContent.replace(`opponent_team:${filterInfo.opponent_team}`, '');
            }
            if (filterInfo.your_team != null) {
                const tempBattles = this.state.battles.filter((battle) => {
                    return battle.your_team.toLowerCase().includes(filterInfo.your_team.toLowerCase());
                });
                tempBattles.forEach((item) => yourTeamBattles.add(item));
                filterContent = filterContent.replace(`your_team:${filterInfo.your_team}`, '');
            }
            if (filterInfo.format != null) {
                const tempBattles = this.state.battles.filter((battle) => {
                    return battle.format.toLowerCase().includes(filterInfo.format.toLowerCase());
                });
                tempBattles.forEach((item) => formatBattles.add(item));
                filterContent = filterContent.replace(`format:${filterInfo.format}`, '');
            }

            console.log(opponentBattles);
            console.log(opponentTeamBattles);
            console.log(yourTeamBattles);
            console.log(formatBattles);


            // set filteredBattles to be the union of all sets
            if (opponentBattles.size > 0) {
                filteredBAttles = new Set(opponentBattles);
            }
            if (opponentTeamBattles.size > 0) {
                if (filteredBattles.size > 0) {
                    // interesct the two sets
                    filteredBattles = new Set([...filteredBattles].filter((x) => opponentTeamBattles.has(x)));
                } else {
                    filteredBattles = new Set(opponentTeamBattles);
                }
            }
            if (yourTeamBattles.size > 0) {
                if (filteredBattles.size > 0) {
                    // interesct the two sets
                    filteredBattles = new Set([...filteredBattles].filter((x) => yourTeamBattles.has(x)));
                } else {
                    filteredBattles = new Set(yourTeamBattles);
                }
            }
            if (formatBattles.size > 0) {
                if (filteredBattles.size > 0) {
                    // interesct the two sets
                    filteredBattles = new Set([...filteredBattles].filter((x) => formatBattles.has(x)));
                } else {
                    filteredBattles = new Set(formatBattles);
                }
            }
            console.log(filteredBattles);
            // strip filter content
            filterContent = filterContent.trim();
            if (filterContent != '') {
                // for each item in the filter input, filter the battles
                const filterItems = filterContent.split(' ');
                for (let i = 0; i < filterItems.length; i++) {
                    const tempBattles = this.state.battles.filter((battle) => {
                        return battle.opponent.toLowerCase().includes(filterItems[i].toLowerCase()) ||
                            battle.opponent_team.toLowerCase().includes(filterItems[i].toLowerCase()) ||
                            battle.your_team.toLowerCase().includes(filterItems[i].toLowerCase()) ||
                            battle.format.toLowerCase().includes(filterItems[i].toLowerCase());
                    });
                    tempBattles.forEach((item) => filteredBattles.add(item));
                }
            }

            // filteredBattles = this.state.battles.filter((battle) =>
            //     battle.format.toLowerCase().includes(filterContent.toLowerCase()) ||
            //     battle.opponent.toLowerCase().includes(filterContent.toLowerCase()) ||
            //     battle.opponent_team.toLowerCase().includes(filterContent.toLowerCase()) ||
            //     battle.your_team.toLowerCase().includes(filterContent.toLowerCase()),
            // );
            // set the state to the filtered battles
            let totalPages = Math.ceil(filteredBattles.size / pageSize);
            if (totalPages === 0) {
                totalPages = 1;
            }

            console.log('totalPages: ' + totalPages);
            console.log(filteredBattles);

            this.setState({
                filter_battles: Array.from(filteredBattles),
                totalPages: totalPages,
            });
        }
    }

    /**
     * Delete selected entries, if deleteAll is true, delete all entries
     * @param {boolean} deleteAll
     */
    async deleteEntries(deleteAll) {
        // find all checkboxes that are checked
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        // if delete all, get all rows of the table
        let rows = [];
        let battleIds = [];
        console.log(deleteAll);
        if (deleteAll) {
            console.log('delete all');
            for (let i = 0; i < this.state.battles.length; i++) {
                battleIds.push(this.state.battles[i].battle_id);
            }
            console.log(battleIds);
        } else {
            // otherwise, get only the rows that are checked
            rows = Array.from(checkboxes).map((checkbox) => checkbox.parentNode.parentNode);
            // get the battle id from the key of the row
            battleIds = Array.from(rows).map((row) => row.getAttribute('data-id'));
        }

        // send POST request to server
        const data = {'battle_ids': battleIds};
        try {
            const resp = await axios.post('api/battle_delete', data);
            if (resp.data.status == 'success') {
                // if successful, remove the battles from the state
                const battles = this.state.battles;
                const filterBattles = this.state.filter_battles;
                for (let i = 0; i < battleIds.length; i++) {
                    battles.splice(battles.findIndex((battle) => battle.battle_id == battleIds[i]), 1);
                    filterBattles.splice(
                        filterBattles.findIndex((battle) => battle.battle_id == battleIds[i]), 1);
                }

                this.setState({
                    battles: battles,
                    filter_battles: filterBattles,
                    totalPages: Math.ceil(battles.length / pageSize),
                });
            } else {
                // if unsuccessful, alert user
                alert(response.data.message);
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * When component unmounts, remove the listener
     */
    componentWillUnmount() {
        window.removeEventListener('resize', debouncedResizeHandler);
    }

    /**
     * When the component updates setup listeners
     */
    componentDidUpdate() {
        const debouncedResizeHandler = debounce(() => {
            this.setState({
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: isMobile() || window.innerWidth < 1200,
            });
        }, 250); // 100ms
        window.addEventListener('resize', debouncedResizeHandler);
        const self = this;
        let typingTimer; // timer identifier
        const $input = $('#filter');
        if ($input == null ) {
            return;
        }
        $input.on('keyup', function() {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(doneTyping, doneTypingInterval);
        });

        // on keydown, clear the countdown
        $input.on('keydown', function() {
            clearTimeout(typingTimer);
        });
        // user is "finished typing," do something

        /**
         * Handler function for when typing stops
         */
        function doneTyping() {
            self.filterBattles('TYPINGTIMEOUT');
        }
    }

    /**
     * When component mounts, get the battles from the server
     */
    async componentDidMount() {
        const self = this;
        // check if user is logged in
        const resp = await axios.get('/api/auth/isloggedin');
        if (resp.data.loggedin) {
            // get all battles
            const battleResp = await axios.get('/api/battles');
            let battles = [];
            if (battleResp.status == 200) {
                battles = battleResp.data.battles;
            }
            this.setState({
                isLoggedIn: true,
                username: resp.data.claims.username,
                battles: battles,
                totalPages: Math.ceil(battles.length / pageSize),
                pageSize: pageSize,
                filter_battles: [...battles],
            });
            return;
        }
        this.setState({
            isLoggedIn: false,
            username: '',
            battles: [],
            totalPages: 1,
            pageSize: pageSize,
        });

        let typingTimer; // timer identifier
        const input = document.getElementById('filter');
        if (input == null ) {
            return;
        }
        input.on('keyup', function() {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(doneTyping, doneTypingInterval);
        });

        // on keydown, clear the countdown
        input.on('keydown', function() {
            clearTimeout(typingTimer);
        });

        /**
         * Handler function for when typing stops
         */
        function doneTyping() {
            self.filterBattles('TYPINGTIMEOUT');
        }
    }

    /**
     * Send login command to the server
     * @param {Object | str} event
     */
    processLogin(event) {
    // check if event is "button" or if it was the enter key
        if (event === 'button' || event.keyCode === 13) {
            const username = document.getElementById('loginUsername').value;
            // send POST request to server
            axios
                .post('api/auth/login', {
                    username: username,
                    password: document.getElementById('loginPassword').value,
                })
                .then(function(response) {
                    if (response.data.status == 'success') {
                        // if successful, set state to logged in
                        setState({
                            isLoggedIn: true,
                            username: username,
                        });
                    } else {
                        // if unsuccessful, alert user
                        alert(response.data.message);
                    }
                })
                .catch(function(error) {
                    console.error(error);
                    // reload the page if there is an error
                    window.location.reload();
                });
        }
    }

    /**
     * Display login modal
    */
    triggerLoginModal() {
        const myModal = new bootstrap.Modal(
            document.getElementById('loginModal'),
            null,
        );
        myModal.toggle();
    }

    /**
     * Render content
     * @return {ReactElement}
    */
    render() {
        let content = null;
        let clearTableButtons = null;
        let navContent = null;
        let usernameContent = null;

        let brandingContent = <div className="col-10 offset-1" style={{
            alignContent: 'center',
            textAlign: 'center',
        }}>
            <h1 style={{color: 'white', fontSize: '3em'}}>
                {/* place the favicon icon here */}
                <img
                    src="/favicon/favicon-32x32.png"
                    style={{width: '32px', height: '32px', marginTop: '-10px'}}
                />
                PS-Stats
                <img
                    src="/favicon/favicon-32x32.png"
                    style={{width: '32px', height: '32px', marginTop: '-10px'}}
                />
            </h1>
            <br/>
        </div>;


        // SECTION Not logged in
        if (!this.state.isLoggedIn && this.state.username != null) {
            if (!this.state.isMobile ) {
                content = (
                    <div>
                        <div className="row">
                            <div className="col-4 offset-4" style={{textAlign: 'center', alignContent: 'center'}}>
                                <button
                                    className="btn btn-light btn-lg"
                                    style={{width: '125px'}}
                                    onClick={() => this.triggerLoginModal()}
                                >
                                    Login
                                </button>
                            </div>
                        </div>
                    </div>
                );
            } else {
                content = (
                    <div>
                        <div className="row">
                            <div className="col-6 offset-3" style={{textAlign: 'center', alignContent: 'center'}}>
                                <button
                                    className="btn btn-light btn-lg"
                                    style={{width: '125px'}}
                                    onClick={() => this.triggerLoginModal()}
                                >
                                    Login
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }
            // !SECTION

        // SECTION Logged in
        } else if (this.state.isLoggedIn && this.state.username != null) {
            const page = this.state.page;
            const self = this;
            if (this.state.totalPages <= 3 || page == 1) {
                const maxSize = Math.min(3, this.state.totalPages);
                navContent = <nav aria-label="Page navigation">
                    <ul className="pagination">
                        <li className="page-item">
                            <a className="page-link" href="#" aria-label="Previous" onClick={
                                () => this.setState({page: 1})}>
                                <span aria-hidden="true">&laquo;&laquo;</span>
                                <span className="sr-only">Previous</span>
                            </a>
                        </li>
                        <li className="page-item" onClick={
                            () => {
                                let newpage = this.state.page - 1;
                                if (newpage < 1 ) {
                                    newpage = 1;
                                }
                                this.setState({page: newpage});
                            }}>
                            <a className="page-link" href="#" aria-label="Previous">
                                <span aria-hidden="true">&laquo;</span>
                                <span className="sr-only">Previous</span>
                            </a>
                        </li>
                        {[...Array(maxSize)].map(function(_, i) {
                            // if the page is the current page, make it active
                            if (i + 1 == page) {
                                return <li className="page-item active">
                                    <a className="page-link" href="#">{i + 1}</a>
                                </li>;
                            }
                            // otherwise, make it inactive
                            return <li key={i} className="page-item" onClick={() => {
                                self.setState({page: i+1});
                            }}>
                                <a className="page-link" href="#">{i + 1}</a>
                            </li>;
                        })}
                        <li className="page-item">
                            <a className="page-link" href="#" aria-label="Next" onClick={
                                () => {
                                    let newpage = this.state.page +1;
                                    if (newpage > this.state.totalPages) {
                                        newpage = this.state.totalPages;
                                    }
                                    this.setState({page: newpage});
                                }
                            }>
                                <span aria-hidden="true">&raquo;</span>
                                <span className="sr-only">Next</span>
                            </a>
                        </li>
                        <li className="page-item">
                            <a className="page-link" href="#" aria-label="Next" onClick={
                                () => this.setState({page: this.state.totalPages})}>
                                <span aria-hidden="true">&raquo;&raquo;</span>
                                <span className="sr-only">Next</span>
                            </a>
                        </li>
                    </ul>
                </nav>;
            } else {
                if (page < this.state.totalPages) {
                    navContent = <nav aria-label="Page navigation">
                        <ul className="pagination">
                            <li className="page-item">
                                <a className="page-link" href="#" aria-label="Previous" onClick={
                                    () => this.setState({page: 1})}>
                                    <span aria-hidden="true">&laquo;&laquo;</span>
                                    <span className="sr-only">Previous</span>
                                </a>
                            </li>
                            <li className="page-item" onClick={
                                () => {
                                    let newpage = this.state.page - 1;
                                    if (newpage < 1 ) {
                                        newpage = 1;
                                    }
                                    this.setState({page: newpage});
                                }}>
                                <a className="page-link" href="#" aria-label="Previous">
                                    <span aria-hidden="true">&laquo;</span>
                                    <span className="sr-only">Previous</span>
                                </a>
                            </li>
                            <li className="page-item" onClick={() => {
                                self.setState({page: page-1});
                            }}>
                                <a className="page-link" href="#">{page - 1}</a>
                            </li>;
                            <li className="page-item active">
                                <a className="page-link" href="#">{page}</a>
                            </li>;
                            <li className="page-item" onClick={() => {
                                self.setState({page: page+1});
                            }}>
                                <a className="page-link" href="#">{page + 1}</a>
                            </li>;
                            <li className="page-item">
                                <a className="page-link" href="#" aria-label="Next" onClick={
                                    () => {
                                        let newpage = this.state.page +1;
                                        if (newpage > this.state.totalPages) {
                                            newpage = this.state.totalPages;
                                        }
                                        this.setState({page: newpage});
                                    }
                                }>
                                    <span aria-hidden="true">&raquo;</span>
                                    <span className="sr-only">Next</span>
                                </a>
                            </li>
                            <li className="page-item">
                                <a className="page-link" href="#" aria-label="Next" onClick={
                                    () => this.setState({page: this.state.totalPages})}>
                                    <span aria-hidden="true">&raquo;&raquo;</span>
                                    <span className="sr-only">Next</span>
                                </a>
                            </li>
                        </ul>
                    </nav>;
                } else {
                    navContent = <nav aria-label="Page navigation">
                        <ul className="pagination">
                            <li className="page-item">
                                <a className="page-link" href="#" aria-label="Previous" onClick={
                                    () => this.setState({page: 1})}>
                                    <span aria-hidden="true">&laquo;&laquo;</span>
                                    <span className="sr-only">Previous</span>
                                </a>
                            </li>
                            <li className="page-item" onClick={
                                () => {
                                    let newpage = this.state.page - 1;
                                    if (newpage < 1 ) {
                                        newpage = 1;
                                    }
                                    this.setState({page: newpage});
                                }}>
                                <a className="page-link" href="#" aria-label="Previous">
                                    <span aria-hidden="true">&laquo;</span>
                                    <span className="sr-only">Previous</span>
                                </a>
                            </li>
                            <li className="page-item" onClick={() => {
                                self.setState({page: page-2});
                            }}>
                                <a className="page-link" href="#">{page - 2}</a>
                            </li>;
                            <li className="page-item" onClick={() => {
                                self.setState({page: page-2});
                            }}>
                                <a className="page-link" href="#">{page-1}</a>
                            </li>;
                            <li className="page-item active" onClick={() => {
                                self.setState({page: page});
                            }}>
                                <a className="page-link" href="#">{page}</a>
                            </li>;
                            <li className="page-item">
                                <a className="page-link" href="#" aria-label="Next" onClick={
                                    () => {
                                        let newpage = this.state.page +1;
                                        if (newpage > this.state.totalPages) {
                                            newpage = this.state.totalPages;
                                        }
                                        this.setState({page: newpage});
                                    }
                                }>
                                    <span aria-hidden="true">&raquo;</span>
                                    <span className="sr-only">Next</span>
                                </a>
                            </li>
                            <li className="page-item">
                                <a className="page-link" href="#" aria-label="Next" onClick={
                                    () => this.setState({page: this.state.totalPages})}>
                                    <span aria-hidden="true">&raquo;&raquo;</span>
                                    <span className="sr-only">Next</span>
                                </a>
                            </li>
                        </ul>
                    </nav>;
                }
            }


            // check if we are on desktop or mobile
            let logoutButton = null;
            if (!this.state.isMobile ) {
                // desktop
                navContent = <div>
                    <br/>
                    {navContent}
                </div>;
                clearTableButtons = <div className="row">
                    <div className="col-4 offset-3">
                        <input type="text" className='form-control'
                            id="filter" placeholder="Filter" onKeyDown={this.filterBattles} />
                    </div>
                    <div className="col-2">
                        <button
                            style={{width: '100%'}}
                            className="btn btn-light"
                            onClick={() => {
                                this.deleteEntries(true);
                            }}
                        >
                            Clear All Entries
                        </button>
                    </div>
                    <div className="col-2">
                        <button
                            style={{width: '100%'}}
                            className="btn btn-light"
                            onClick={() => {
                                this.deleteEntries(false);
                            }}
                        >
                            Delete Selected Entries
                        </button>
                    </div>
                </div>;

                logoutButton = <button
                    className="btn btn-light"
                    style={{fontWeight: 'bold', width: '125px'}}
                    onClick={() => (window.location.href = '/api/auth/logout')}
                >
                Logout
                </button>;
                brandingContent = <div className="col-5 offset-1" style={{
                    alignContent: 'left',
                    textAlign: 'left',
                }}>
                    <h1 style={{color: 'white'}}>
                        {/* place the favicon icon here */}
                        <img
                            src="/favicon/favicon-32x32.png"
                            style={{width: '32px', height: '32px', marginTop: '-10px'}}
                        />
                        PS-Stats
                        <img
                            src="/favicon/favicon-32x32.png"
                            style={{width: '32px', height: '32px', marginTop: '-10px'}}
                        />
                    </h1>
                </div>;
                content = (
                    <div>
                        <br/>
                        <div className="row">
                            {/* <div className="col-2"></div> */}
                            <div className="col-10 offset-1">
                                <BattlesTable battles={this.state.filter_battles}
                                    pageNumber={this.state.page}
                                    pageSize={this.state.pageSize}>
                                </BattlesTable>
                            </div>
                        </div>
                    </div>
                );
            } else {
                // mobile
                clearTableButtons =
                <div>
                    <div className="row">
                        {/* Add a delete button underneath content */}
                        <div className="col-12">
                            <input type="text" className='form-control'
                                id="filter" placeholder="Filter" onKeyDown={this.filterBattles} />
                        </div>
                    </div>;
                    <div className="row">
                        <div className="col-8 offset-2">
                            <button
                                style={{width: '100%'}}
                                className="btn btn-light"
                                onClick={() => {
                                    this.deleteEntries(true);
                                }}
                            >
                            Clear All Entries
                            </button>
                        </div>
                    </div>;
                    <div className="row">
                        <div className="col-8 offset-2">
                            <button
                                style={{width: '100%'}}
                                className="btn btn-light"
                                onClick={() => {
                                    this.deleteEntries(false);
                                }}
                            >
                            Delete Selected Entries
                            </button>
                        </div>
                    </div>;
                </div>;

                logoutButton = <button
                    className="btn btn-light"
                    style={{fontWeight: 'bold', width: '125px', marginLeft: '-10%'}}
                    onClick={() => (window.location.href = '/api/auth/logout')}
                >
                Logout
                </button>;
                brandingContent = <div className="col-6" style={{
                    alignContent: 'left',
                    textAlign: 'left',
                }}>
                    <h1 style={{color: 'white'}}>
                        {/* place the favicon icon here */}
                        <img
                            src="/favicon/favicon-32x32.png"
                            style={{width: '32px', height: '32px', marginTop: '-10px'}}
                        />
                        PS-Stats
                        <img
                            src="/favicon/favicon-32x32.png"
                            style={{width: '32px', height: '32px', marginTop: '-10px'}}
                        />
                    </h1>
                </div>;
                content = (
                    <div>
                        <div className="row">
                            {/* <div className="col-2"></div> */}
                            <div className="col-12">
                                <BattlesTable battles={this.state.filter_battles}
                                    pageNumber={this.state.page}
                                    pageSize={this.state.pageSize}
                                    isMobile={this.state.isMobile}>
                                </BattlesTable>
                            </div>
                        </div>
                        <br />
                    </div>
                );
            }
            usernameContent = (
                <div style={{
                    alignContent: 'right',
                    textAlign: 'right'}}
                className="col-3 offset-2">
                    <h2 style={{color: 'white'}}>{this.state.username}</h2>
                    <br />
                    {logoutButton}
                </div>
            );
        }
        // !SECTION

        return (
            <div className="container-fluid">
                <br></br>
                <div className="row">
                    {brandingContent}
                    {usernameContent}
                    <br/>
                </div>
                <br/>
                {/* Clear table buttons */}
                {clearTableButtons}
                {/* display content */}
                <div className="row">
                    <div className="col-12">
                        {content}
                    </div>
                </div>
                <div className="row" style={
                    {alignContent: 'center', textAlign: 'center', justifyContent: 'center'}}>
                    <div className="col-12 d-flex justify-content-center" style={
                        {alignContent: 'center', textAlign: 'center', justifyContent: 'center'}}>
                        {navContent}
                    </div>
                </div>

                {/* modal for login */}
                <div
                    className="modal fade"
                    id="loginModal"
                    tabIndex="-1"
                    role="dialog"
                    aria-labelledby="loginModal"
                    aria-hidden="true"
                >
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Login</h3>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    {/* restrict username to alphanumeric characters only */}
                                    <label htmlFor="loginUsername">Username</label>
                                    <input
                                        type="text"
                                        onKeyDown={(event) => this.processLogin(event)}
                                        className="form-control"
                                        id="loginUsername"
                                        placeholder="Username"
                                    />
                                    {/* password */}
                                    <label htmlFor="loginPassword">Password</label>
                                    <input
                                        type="password"
                                        onKeyDown={(event) => this.processLogin(event)}
                                        className="form-control"
                                        id="loginPassword"
                                        placeholder="Password"
                                    />
                                    {/* submit button */}
                                    <br></br>
                                    <button
                                        type="submit"
                                        className="btn btn-dark btn-small"
                                        onClick={() => this.processLogin('button')}
                                    >
                                        Login
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        );
    }
}

const domContainer = document.getElementById('react_content');
root = ReactDOM.createRoot(domContainer);
const content = e(Main);
root.render(
    <React.StrictMode>
        {content}
    </React.StrictMode>,
);
