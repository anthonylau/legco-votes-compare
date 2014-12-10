var billURL = 'data/bills.xml';
var membersURL = 'data/members.xml';
var bills = {};
var members = {};

var Member = function(name) {
	this.name = name;
	this.score = 0;
	this.party = '';
	this.elect = '';
	this.addScore = function(delta) {
		this.score += delta;
	};
};

function getMember(name) {
	if (!members[name]) {
		members[name] = new Member(name);
	}
	return members[name];
}

function ready() {
	for ( var bill in bills) {
		if (!bills[bill].data) {
			console.log(bill + ' not ready');
			return;
		}
	}
	main();
}

$.get(billURL, function(xml) {
	var bs = $.xml2json(xml, true);
	for ( var i = 0; i < bs.bill.length; i++) {
		var bill = bs.bill[i];
		if (bill.code) {
			bills[bill.code] = {};
		}
	}
}, 'xml');

$.get(membersURL, function(xml) {
	var mems = $.xml2json(xml, true);
	var organs = {};
	for ( var i = 0; i < mems.organs[0].organ.length; i++) {
		var organ = mems.organs[0].organ[i];
		organs[organ.code] = organ;
	}
	for ( var i = 0; i < mems.members[0].member.length; i++) {
		var mem = mems.members[0].member[i];
		var m = getMember(mem);
		m.party = organs[mem.party];
		m.elect = mem.elect;
	}
	for ( var billName in bills) {
		loadBillData(billName);
	}
}, 'xml');

function loadBillData(billName) {
	$.get('data/' + billName + '.xml', function(xml) {
		var data = $.xml2json(xml, true);
		bills[billName] = {
			'data' : data
		};
		ready();
	}, 'xml');
}

function calcScore() {
	var content = $('#result');
	content.empty();
	for ( var i in members) {
		members[i].score = 0;
	}
	for ( var billCode in bills) {
		var bill = bills[billCode].data;
		console.log(billCode + ':' + $('#' + billCode).val());
		var choice = $('#' + billCode).val();
		var yes = 0, no = 0, aban = 0;
		if (choice == 1) {
			yes = 1;
			no = -1;
			if($('#chkbGiveup').attr('checked')){
				aban = -0.5;
			}
		} else if (choice == 0) {
			yes = 0;
			no = 0;
		} else if (choice == -1) {
			yes = -1;
			no = 1;
			if($('#chkbGiveup').attr('checked')){
				aban = -0.5;
			}
		}
		for ( var a in bill.yes[0].vote) {
			getMember(bill.yes[0].vote[a].text).addScore(yes);
		}
		for ( var a in bill.no[0].vote) {
			getMember(bill.no[0].vote[a].text).addScore(no);
		}
		for ( var a in bill.aban[0].vote) {
			getMember(bill.aban[0].vote[a].text).addScore(aban);
		}
	}

	var rawFilter = $('#filters').val();
	var filters = rawFilter.split(',');
	var filterMap = {};
	var filterCnt = 0;
	for ( var i in filters) {
		if (filters[i].trim().length > 0) {
			filterMap[filters[i].trim()] = 1;
			filterCnt++;
		}
	}

	var result = Array();
	for ( var memberName in members) {
		var member = getMember(memberName);
		// content.append(member.name +':' + member.score + '<br/>');
		if (filterMap[memberName])
			result.push(member);
		else if (filterCnt == 0)
			result.push(member);
	}
	result.sort(function(a, b) {
		if (a.score > b.score) {
			return 1;
		} else if (a.score < b.score) {
			return -1;
		} else {
			return 0;
		}
	});
	result.reverse();
	content.append('<table id="resultTable"></table>');
	$('#resultTable').append('<thead id="resultTableTH"></thead>');
	$('#resultTable thead').append('<tr></tr>');
	$('#resultTable thead tr').append('<th>Name</th>');
	$('#resultTable thead tr').append('<th>Party</th>');
	$('#resultTable thead tr').append('<th>Elect</th>');
	$('#resultTable thead tr').append('<th>Score</th>');
	$('#resultTable').append('<tbody></tbody>');
	for ( var i in result) {
		var m = result[i];
		$('#resultTable tbody').append('<tr></tr>');
		$('#resultTable tbody tr:last-child').append('<td>' + m.name + '</td>');
		$('#resultTable tbody tr:last-child')
				.append('<td>' + m.party + '</td>');
		$('#resultTable tbody tr:last-child')
				.append('<td>' + m.elect + '</td>');
		$('#resultTable tbody tr:last-child')
				.append('<td>' + m.score + '</td>');
		// content.append(m.name +':' + m.score + ':' +m.party
		// +':'+m.elect+'<br/>');
	}
	// content.append('</tbody>');
	// content.append('</table>');

	$('#resultTable').dataTable({
		"bPaginate": false,
		"aaSorting" : [ [ 3, "desc" ] ]
	});
}

function main() {
	var content = $('#content');
	content.css('display', 'table');

	for ( var billCode in bills) {
		var bill = bills[billCode].data;
		console.log('building bill ' + billCode);
		content.append('<div id="row_' + billCode
				+ '" style="padding: 25px;" class="bill_row"></div>');
		var block = $('#row_' + billCode);
		block.append('<label style="font-weight: bold">' + bill.name
				+ '</label>');
		block.append('<br/>');
		block.append(bill.desc);
		block.append('<br/>');
		block.append('<select id="' + billCode
				+ '"  style="display: table-cell"></select>');
		block.find('select').append('<option value="0"></option>');
		block.find('select').append('<option value="1">Yes</option>');
		block.find('select').append('<option value="-1">No</option>');
	}

}

var _gaq = _gaq || [];
_gaq.push([ '_setAccount', 'UA-383429-4' ]);
_gaq.push([ '_trackPageview' ]);

(function() {
	var ga = document.createElement('script');
	ga.type = 'text/javascript';
	ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl'
			: 'http://www')
			+ '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(ga, s);
})();
