/*
 * Assign 'docutils' class to tables so styling and
 * JavaScript behavior is applied.
 *
 * https://github.com/mkdocs/mkdocs/issues/2028
 */

$('div.rst-content table').addClass('docutils');

// Add a "Back to Homepage" link at the very top of the sidebar table-of-contents.
(function injectHomepageLink() {
  try {
    var menu = $('.wy-menu.wy-menu-vertical').first();
    if (!menu.length) return;

    var homepageHref = 'https://veriforensic.com';
    if (menu.find('a[href="' + homepageHref + '"]').length) return;

    var caption = $('<p class="caption"><span class="caption-text">VeriForensic</span></p>');
    var ul = $('<ul></ul>');
    var li = $('<li class="toctree-l1"></li>');
    var a = $('<a class="reference external"></a>')
      .attr('href', homepageHref)
      .attr('target', '_blank')
      .attr('rel', 'noopener')
      .text('← Back to Homepage');
    li.append(a);
    ul.append(li);

    menu.prepend(ul);
    menu.prepend(caption);
  } catch (e) {
    // Never break docs rendering on sidebar injection failures.
  }
})();

// Inject "Whitepaper" into the left nav (this repo vendors the built MkDocs output,
// so we add the nav entry at runtime rather than regenerating the whole site).
(function injectWhitepaperNav() {
  try {
    var base = (typeof base_url === 'string' && base_url.length) ? base_url : '.';
    var whitepaperHref = base + '/whitepaper_provenance/';

    // Find the Start Here section list.
    var startHereCaption = $('p.caption span.caption-text').filter(function () {
      return ($(this).text() || '').trim() === 'Start Here';
    }).first();
    if (!startHereCaption.length) return;

    var startHereUl = startHereCaption.closest('p.caption').nextAll('ul').first();
    if (!startHereUl.length) return;

    // Avoid duplicates if this script runs more than once.
    if (startHereUl.find('a[href="' + whitepaperHref + '"]').length) return;

    var overviewLink = startHereUl.find('a[href$="OVERVIEW/"]').first();
    var li = $('<li class="toctree-l1"></li>');
    var a = $('<a class="reference internal"></a>').attr('href', whitepaperHref).text('Whitepaper (Provenance)');
    li.append(a);

    // Insert after Overview when present, otherwise append to Start Here list.
    if (overviewLink.length) {
      overviewLink.closest('li').after(li);
    } else {
      startHereUl.append(li);
    }

    // Mark as current when visiting the whitepaper.
    if (
      (window.location.pathname || '').indexOf('/whitepaper_provenance/') !== -1 ||
      (window.location.pathname || '').indexOf('/WHITEPAPER_PROVENANCE/') !== -1
    ) {
      startHereUl.find('li.current').removeClass('current');
      startHereUl.find('a.reference.internal.current').removeClass('current');
      li.addClass('current');
      a.addClass('current');
    }
  } catch (e) {
    // Never break docs rendering on nav injection failures.
  }
})();
