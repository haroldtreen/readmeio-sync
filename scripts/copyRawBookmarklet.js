(function() {
    $('a.fa-cog').last()[0].click();
    $('a.ng-scope').last().click();
    var text = $('textarea.raw').siblings().last().text();
    setTimeout(function() {
        window.prompt('Copy to clipboard: Ctrl+C, Enter', text);
    }, 300);
    $('a.ng-scope').last().click();
}());