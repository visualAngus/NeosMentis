window.scrollTo({
    top: 0,
});

document.addEventListener('scroll', function() {
    // Get current scroll position
    const scrollPosition = document.body.scrollTop || document.documentElement.scrollTop;
    
    if (scrollPosition > 50) {
        // If the current scroll position is more than 50, add the scroll class to the header
        document.querySelector('.div_bnt_editor').classList.add('scroll');
    }
    else {
        // Otherwise, remove it
        document.querySelector('.div_bnt_editor').classList.remove('scroll');
    }
});