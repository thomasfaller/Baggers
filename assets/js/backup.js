
var Nav, DragReveal, app;
var lastScrollTop=0;
var okay = true;
$(function(){    
    var hash = window.location.hash;
    if(hash){
        hash = hash.substring(2);
    }

    // Sometimes we force no-js mode for fallback version
	if ($('html').hasClass('no-js')) return;

    NoJsMode = function(){
        var obj = this;
        var dir = 'down';

        $('html').removeClass('js').addClass('no-js no-js-mode');

        $('#share-panel').on('click', function(e){ 
            e.preventDefault();
            $(this).closest('.share-panel').toggleClass('open'); 
        });

        $('.car').each(function(){ 
            $(this).on('click', function(){
                var y = $(this).offset().top;
                $('html, body').stop().animate({ 'scrollTop': y}, 600, 'swing');
            });
        });
    };

    PromoteLinks = function(el, clickOrHover){
        var obj = this;
        obj.el = $(el);
		obj.button = obj.el.find('.promote-button');
        obj.sharePanel = $('#share-panel');
        obj.shareBtn = obj.sharePanel.find('.button');
		
        this.init = function(){
			if (clickOrHover == 'click') {
                obj.button.on('click', obj.onClick);
            } else {
                obj.button.on('mouseenter', obj.onClick);
            }
			obj.el.on('mouseleave', obj.close);
			$('.auto-select', obj.el).on('click', function(){ $(this).select(); });
			$(window).on('scroll', obj.onScroll).on('resize', obj.onResize);
			obj.setColor();
			obj.onResize();
		};
		this.onResize = function(){
			var newTop = obj.el.height() * -1;
			obj.el.css('top', newTop);
		};
		this.onScroll = function(){
			if (obj.el.hasClass('open')) obj.close();
		};
		this.onClick = function(e){
			e.preventDefault();
			obj.setColor();
			obj.el.toggleClass('open').toggleClass('ontop');
			
			if (obj.el.hasClass('wallpapers')) obj.populateLinks();
		};
		this.close = function(){
			if (obj.el.hasClass('open')) obj.el.removeClass('open');
		};
		this.setColor = function(){
            var bg = obj.button.css('backgroundColor');
            var color = obj.button.css('color');
            obj.el.css('background', bg).css('color', color);
            //obj.sharePanel.add(obj.shareBtn).css('background', bg).css('color', color);
        };
		this.populateLinks = function(){
			$('li a', obj.el).each(function(){
				var size = $(this).attr('data-size');
				$(this).attr('href', '/Static/Content/BondCars/bond-img/' + size + '/c' + app.currPage + '.jpg'); //'bond-img/bond-download.php?file=bond-img/'+size+'/c'+app.currPage+'.jpg');
			});
		};
        this.init();
    };

    DragReveal = function(el){
        var obj = this;
        obj.el = $(el);

        this.maskDiv = obj.el.find('.photo-mask');
        this.maskWidth = obj.maskDiv.width();
        this.dragger = $(".dragger", obj.el);
        this.draggerOrigin = obj.dragger.attr('data-x');

        this.init = function(){
            obj.dragger.draggable({ 
                axis: "x", 
                containment: "parent",
                drag: obj.onDrag,
                stop: obj.onDrop
            });
        };
        this.onDrag = function(event, ui) {
            var newWidth = ui.position.left + 67;
            obj.maskDiv.width(newWidth);
        };
        this.onDrop = function(event, ui) {
            obj.maskDiv.animate({'width': obj.maskWidth}, 200 );
            obj.dragger.animate({'left': obj.draggerOrigin}, 500, "easeOutBack");
        };
        this.init();
    };

    CarNav = function(el){
        var obj = this;
        obj.el = $(el);

        this.prevCurr = 1;   // use this to calculate distance between cars when switching
		this.active = [];

        this.init = function(){
            obj.onResize(null);
            $(window).on('scroll', obj.snapPointListener);
            $('li', obj.el).on('click', obj.onNavClick);
            if(hash){
                obj.onNavClick(null, hash);
            }
        };
        this.onResize = function(wh){
            var ul = obj.el.find('ul');
			var offset = (wh - ul.height() ) / 2;
			ul.css('top', offset);
        };
        this.onNavClick = function(e, n, speed){
            var n = n || $(e.target).closest('li').index()+1; 
            if (e)  e.preventDefault();

            if (Math.abs(obj.prevCurr - n)==1) obj.switchCar(n);
            obj.changePageTransition(n, speed);
        };
	this.onNavClick2 = function(e, n, speed){
            
            if (e)  e.preventDefault();

            if (Math.abs(obj.prevCurr - n)==1) obj.switchCar(n);
            return obj.changePageTransition2(n, speed);
        };
		this.snapPointListener = function(){
            var yPos = $(window).scrollTop();
			var n = Math.floor(yPos / app.PAGEHEIGHT);
            if (n == app.currPage) return;

            obj.switchCar(n);
        };
		
		this.switchCar = function(n){
            obj.prevCurr = app.currPage;
            app.currPage = n;
			obj.setActiveNavItem(n);
            obj.setActiveCar(n);
            var car = $('li', obj.el).eq(n-1).find('a').attr('href');
            var forUrl = car.substring(1);
            var stateObj = {};
            //if(history.pushState){ history.pushState(stateObj, forUrl, ""); }
		};
		this.goPrevious = function(){
			if (app.currPage == 1) return;
			app.currPage--;
			obj.onNavClick(null, app.currPage);
		};
		this.goNext = function(){     
			if (app.currPage == app.numOfCars) return;
			app.currPage++;
			obj.onNavClick(null, app.currPage);
		};
        
        this.setActiveCar = function(n){
            if (Math.abs(obj.prevCurr - n)>1) return;

            app.aCars.eq(n).addClass('adjacent').removeClass('active');  
			if (n-2 >= 0) app.aCars.eq(n-2).addClass('adjacent').removeClass('active');
			if (n-1 >= 0) app.aCars.eq(n-1).addClass('active').removeClass('adjacent');
			// hide old adjacents, lower down the car stack - don't need to worry about ones above cos they are 0px x 0px
			app.aCars.filter(':gt('+(n)+')').removeClass(' active adjacent');
        };
        this.setActiveNavItem = function(n){
            $('li', obj.el).removeClass('current').eq(n-1).addClass('current');
        };
        this.changePageTransition = function(n, sp){
            var yPos = app.getScrollPosFromCurrent(n),
                dirDown = (n > app.currPage) ? true : false,
                distance = Math.abs(obj.prevCurr - n),
                speed = (distance/4) * 2000,
				carEase = (distance < 4) ? 'linear' : 'swing';

            speed = (speed < 400) ? 400 : speed;    // min speed 
            if (sp) speed = sp;
            $('html, body').stop().animate({ 'scrollTop': yPos}, speed, carEase);
	    
        };
	this.changePageTransition2 = function(n, sp){
            var yPos = app.getScrollPosFromCurrent(n),
                dirDown = (n > app.currPage) ? true : false,
                distance = Math.abs(obj.prevCurr - n),
                speed = (distance/4) * 2000,
				carEase = (distance < 4) ? 'linear' : 'swing';

            speed = (speed < 200) ? 200 : speed;    // min speed 
	    console.log(speed);
            if (sp) speed = sp;
            $('html, body').stop().animate({ 'scrollTop': yPos}, speed, carEase);
	    return yPos;
        };
        this.init();
    }

    app = {
        PAGEHEIGHT:     1000,	// never change this, not unless you want to re-write ALL of your data-animations in your HTML 
		NOJSMODE:       false,
            
        numOfCars:      0,
        currPage:       0,
        prevScroll:     -100,
        aCars:          new Array(),

        bodyWrap:       $('#body-wrap'),
        carsLayer:      $('#cars-layer'),
        carsNav:        [],
        promote:        null,


        init: function(){

			app.preloadImages();

            app.aCars = $('.car', app.carsLayer);
            app.numOfCars = app.aCars.length;

            // iPad?
            var isiPad = navigator.userAgent.match(/iPad/i) != null;
            if (isiPad) {
                $('#js-body').addClass('isiPad');
                new PromoteLinks($('.promote-panel.embed'), 'click');
            }

            // FALLBACK to no-js-mode if less than 960! - phones can't handle all the skrollr stuff
            if ($(window).width() < 960) {
				
				new NoJsMode();
			
			} else {

                // DESKTOP Skrollr version
				skrollr.init({
					forceHeight: false,
					render: function(){
                        // do something?
					}
				});

				// set body height
				var bodyHeight = (app.numOfCars * app.PAGEHEIGHT) + (app.PAGEHEIGHT*2); // front page + hidden page
				$('body').height(bodyHeight);

				// Instantiate CarNav, Draggables, Promote and share panels.
				app.carsNav = new CarNav('#cars-nav');
                $('.promote-panel').each(function(){ new PromoteLinks(this); });
				$('.photo-mask-wrap').each(function(){ new DragReveal(this); });

                $('#front-page').find('a, .front-car').on('click', function(){ 
                    app.carsNav.onNavClick(null, 1, 1600);
                    return false; 
                });

                $('#share-panel')
                    .on('hover', function(){ $(this).closest('.share-panel').toggleClass('open'); })
                    .on('click', function(){ return false; });

                $(document)
                    .on('keydown', app.onKeypress);
                $(window)
                    .on('scroll', app.onScroll)
                    .on('load', app.onLoad)
					.on('resize', app.onResize);
					app.onResize();		// do it now!
			}
        },
        onScroll: function(){ 
		if(okay == false && $(window).scrollTop() == app.getScrollPosFromCurrent(app.currPage)){
		okay =true;
		}
			
			$('li a').on('click', function(){ 
				console.log("ok");
			    okay =false;
			});
			
		
		if(okay){
		   if (app.currPage == app.numOfCars) return;
		   
		   var nextpage = 0;
		   var prevpage = 0;
		   if($(window).scrollTop()==0)  nextpage =1;
		   
		   var st = $(window).scrollTop();
		   if (st > lastScrollTop){
				if($(window).scrollTop() > app.getScrollPosFromCurrent(app.currPage)+30){
				app.currPage++;
				nextpage =1;
				}
				if($(window).scrollTop() < app.getScrollPosFromCurrent(app.currPage) && nextpage == 1){
				app.carsNav.onNavClick2(null, app.currPage);
				}
		   }else{

		   
				if($(window).scrollTop() > app.getScrollPosFromCurrent(app.currPage)+900){
				prevpage =1;
				}
				if($(window).scrollTop() > app.getScrollPosFromCurrent(app.currPage) && prevpage == 1){
				app.carsNav.onNavClick2(null, app.currPage);
				}
		   }
		   lastScrollTop = st;
		   }
		  /* 
            var yPos = $(window).scrollTop();
            if (app.prevScroll < 0) {
                setTimeout(function(){ $(window).scrollTop(1); }, 600);
            }
            app.prevScroll = yPos;*/
	   
	   /* if (app.currPage == app.numOfCars) return;
			app.currPage++;
			var a = app.carsNav.onNavClick2(null, app.currPage);
			console.log($(window).scrollTop());
			if($(window).scrollTop() > a){
			return false;
			}
			console.log($(window).scrollTop());
			var lastScrollTop =0;
			  var st = $(window).scrollTop();
			   if (st > lastScrollTop){
			   console.log(st);
			      app.currPage++;
				var nextpage = true
				if($(window).scrollTop() < app.getScrollPosFromCurrent(app.currPage) && nextpage){
				app.carsNav.onNavClick2(null, app.currPage);
				nextpage =false
				}
			   } else {
				console.log(st);
			        app.currPage--;
				var nextpage = true
				if($(window).scrollTop() < app.getScrollPosFromCurrent(app.currPage) && nextpage){
				app.carsNav.onNavClick2(null, app.currPage);
				nextpage =false
				}
			   }
			   lastScrollTop = st;*/
			   
			
			
		
        },
        onLoad: function(){},
        onResize: function(){
            // set bodyWrap height
            app.bodyWrap.height($(window).height());

            // aspect ratio?
            var ww = $(window).width();
            var wh = $(window).height();
            var isLandscape = (ww > wh);

            // cars layer - force square using longest side
            var sq = (isLandscape) ? Math.ceil(ww * 1.5) : Math.ceil(wh * 1.5);
            var leftOffset = Math.ceil(((sq - ww ) / 2)*-1);
            var topOffset = Math.ceil(((sq - wh ) / 2)*-1);
            app.carsLayer.width(sq).height(sq).css({
                'left': leftOffset,
                'top': topOffset
            });
            
            // resize the nav
            app.carsNav.onResize(wh);
        },
		onKeypress: function(e){
            if ($('.embed.open').length) return;
            switch(e.keyCode){
                case 37:    app.carsNav.goPrevious(); break;
                case 39:    app.carsNav.goNext(); break;
                default:
            }
        },
        getScrollPosFromCurrent: function(n){
            return ((n-1) * app.PAGEHEIGHT) + app.PAGEHEIGHT;
        },
        getCurrentFromScrollPos: function(){
            return Math.floor($(window).scrollTop() / 1000);
        },
        preloadImages: function(){
            $('.illustration, .date', app.carsLayer).each(function(){
                var path = $(this).css('backgroundImage').substring(4).replace(/(\s+)?.$/, '');
                var img = new Image();
                img.src = path;
                //img.onload = function(){ console.log(path + ' loaded!'); };
            });
        },
        isLandscape: function(){
            var ww = $(window).width();
            var wh = $(window).height();
            return (ww > wh);
        }
    };  
    app.init();
});