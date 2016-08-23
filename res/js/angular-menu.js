/**	
 *	AngularJS JSON Menu App
 *	Version:	1.1
 *	Created:	2016-03-05
 *	Updated:	2016-05-14
 *	Author:		Gonzalo Albito Mendez Rey
 *	Contact:	gonzalo@albito.es
 *	License:	GNU GPL v3
 */

var LocationMenuController = ["$location", function($location){
	/** This variable provides a way to access "this" object when "this" is another object.
	 */
	var _this = this;
	
	this.getCurrentId = function(){
		return $location.hash();
	};
	
	this.setCurrentId = function(id){
		id = id instanceof Object? id.id : id;
		$location.hash(id);
	};
}];

var JsonMenuService = ["$http", "$log", function($http, $log){
	/** This variable provides a way to access "this" object when "this" is another object.
	 */
	var _this = this;
	var menuModel = {
		"id": "",	//Optional. Used to identify the item
		"title": "",	//Required. Is the main text of the item
		"description": "",	//Optional. Used to provide a description for the item
		"image": "",	//Optional. Used to provide an image url for the item's logo
		"icon": "fa-home",	//Optional. Used to provide a font-awesome code for the item's icon. Ignored if logo attribute is setted.
		"url": false,		//Optional. Item's click action URL.
		"items": []	//Optional. List of item's children.
	};
	//var menu = [];

	this.findById = function(menuObj, id){
		var found = false;
		if(menuObj && id)
		{
			if(menuObj.id && menuObj.id==id)
			{
				found = menuObj;
			}
			else if(menuObj.items && menuObj.items instanceof Array)
			{
				for(var i=0; !found && i<menuObj.items.length; i++)
				{
					found = _this.findById(menuObj.items[i], id);
				}
			}
		}
		return found;
	};
	this.mergeModel = function(menuObj){
		menuObj = angular.merge(angular.merge({}, menuModel), menuObj);
		for(var i=0; i<menuObj.items; i++)
		{
			menuObj.items[i] = _this.mergeModel(menuObj);
		}
		return menuObj;
	};
	/*
	this.getMenu = function(id){
		return id? _this.findById(menu, id) : menu;
	};
	var setMenu = function(menuObj){
		menu = _this.mergeModel(menuObj);
	};
	*/
	this.loadMenu = function(url, callback){
		if(url)
		{
			$http.get(url).then(
				function successCallback(response){
					var menuObj = _this.mergeModel(response.data);
					//setMenu(menuObj);
					if(callback && typeof callback=="function"){
						callback(menuObj);
					}
				},
				function errorCallback(response) {
					var error = "Can't load menu json file";
					var menuObj = angular.merge({}, menuModel);
					menuObj.title = "Error";
					menuObj.description = error;
					menuObj.icon = "fa-times";
					//setMenu(menuObj);
					if(callback && typeof callback=="function"){
						callback(menuObj);
					}
					$log.error(error);
				});
		}
	};
}];

var JsonMenu = function(){
	return {
		restrict: "E",
		scope: {
			menu: "=",
			defaultId: "=",
			currentId: "=",
			onChange: "="
		},
		replace: true,
		template: "<div class=\"menu json-menu\">"
					+"<div class=\"menu-item current-item\">"
						+"<div class=\"item-media\">"
							+"<img class=\"image\" ng-if=\"jmCtrl.getCurrent().image\" ng-src=\"jmCtrl.getCurrent().image\"/>"
							+"<i class=\"icon fa\" ng-if=\"jmCtrl.getCurrent().icon\" ng-class=\"'fa-'+jmCtrl.getCurrent().icon\"></i>"
						+"</div>"
						+"<div class=\"item-data\">"
							+"<h2 class=\"item-title\" ng-if=\"jmCtrl.getCurrent().title\">{{jmCtrl.getCurrent().title}}</h2>"
							+"<p class=\"item-description\" ng-if=\"jmCtrl.getCurrent().description\">{{jmCtrl.getCurrent().description}}</p>"
						+"</div>"
						+"<div class=\"item-back\" ng-if=\"jmCtrl.canBack()\">"
							+"<span class=\"back\" ng-click=\"jmCtrl.back()\"><i class=\"icon fa fa-arrow-left\"></i></span>"
						+"</div>"
					+"</div>"
					+"<div class=\"item-children submenu\" ng-if=\"jmCtrl.getCurrent().items && jmCtrl.getCurrent().items.length>0\">"
						//+"<json-menu ng-repeat=\"item in jmCtrl.getCurrent().items\" menu=\"item\"></json-menu>"
						+"<div class=\"menu-item\" ng-repeat=\"item in jmCtrl.getCurrent().items\" ng-click=\"jmCtrl.click(item)\">"
							+"<div class=\"item-media\">"
								+"<img class=\"image\" ng-if=\"item.image\" ng-src=\"{{item.image}}\"/>"
								+"<i class=\"icon fa\" ng-if=\"item.icon\" ng-class=\"'fa-'+item.icon\"></i>"
							+"</div>"
							+"<div class=\"item-data\">"
								+"<h4 class=\"item-title\" ng-if=\"item.title\">{{item.title}}</h4>"
								+"<p class=\"item-description\" ng-if=\"item.description\">{{item.description}}</p>"
							+"</div>"
						+"</div>"
					+"</div>"
				+"</div>",
		link: function($scope, $element, $attributes, controller){
			var a = $scope;
		},
		controller: ["$scope", "$jsonMenu", "$location", "$window", "$log", function($scope, $jsonMenu, $location, $window, $log){
			/** This variable provides a way to access "this" object when "this" is another object.
			 */
			var _this = this;
			var menuModel = {
				"id": "",	//Optional. Used to identify the item
				"title": "",	//Required. Is the main text of the item
				"description": "",	//Optional. Used to provide a description for the item
				"image": "",	//Optional. Used to provide an image url for the item's logo
				"icon": "fa-home",	//Optional. Used to provide a font-awesome code for the item's icon. Ignored if logo attribute is setted.
				"url": false,		//Optional. Item's click action URL.
				"items": []	//Optional. List of item's children.
			};
			var menu = [];
			
			var current = false;
			var history = [];

			this.getMenu = function(){
				return menu;
			};

			var setMenu = function(newMenu, defaultItem){
				menu = (newMenu instanceof Object)? newMenu : angular.merge({}, menuModel);
				var findId = $scope.currentId? (typeof $scope.currentId=="function"? $scope.currentId() : $scope.currentId) : ($scope.defaultId? $scope.defaultId : menu.defaultId);
				if(findId)
				{
					var currentMenu = $jsonMenu.findById(menu, findId);
					if(currentMenu)
					{
						_this.setCurrent(currentMenu);
					}
				}
			};

			this.getCurrent = function(){
				return current? current : menu;
			};

			this.setCurrent = function(currentMenu, skipHistory){
				if(currentMenu && (_this.getCurrent()!=currentMenu))
				{
					if(!skipHistory)
					{
						history.push(_this.getCurrent());
					}
					current = currentMenu;
					if($scope.onChange && typeof $scope.onChange=="function")
					{
						$scope.onChange(current);
					}
				}
			};

			this.click = function(item){
				if(item)
				{
					if(item.url)
					{
						$window.open(item.url, "_self");
					}
					else if(item.items)
					{
						_this.setCurrent(item);
					}
				}
			};

			this.getHistory = function(){
				return history;
			};

			this.canBack = function(){
				return history && history.length>0;
			};

			this.back = function(){
				if(history && history.length>0)
				{
					var lastMenu = history.pop();
					_this.setCurrent(lastMenu, true);
				}
			};
			
			var init = function(){
				$log.info("The controller");
				if($scope.menu)
				{
					if($scope.menu instanceof Object)
					{
						setMenu($scope.menu);
					}
					else if(typeof $scope.menu=="string")
					{
						$jsonMenu.loadMenu($scope.menu, setMenu);
					}
				}
			};
			
			init();
		}],
		controllerAs: "jmCtrl"
	}
};

var JsonMenuApp = angular.module("JsonMenu", []);
JsonMenuApp.service("$jsonMenu", JsonMenuService);
JsonMenuApp.directive("jsonMenu", JsonMenu);
JsonMenuApp.controller("LocationMenuController", LocationMenuController);
