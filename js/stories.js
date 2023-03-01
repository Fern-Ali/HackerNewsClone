"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDelete = false) {
  // console.debug("generateStoryMarkup", story);

    const hostName = story.getHostName();

    const isUserLoggedIn = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        ${showDelete ? getDeleteBtnHTML() : ""}
        ${isUserLoggedIn ? getFavBtns(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        <div id="button1holder"><small class="story-user"><button id="fav" type="submit" class="# heart">&#128151</button></div></small>
        <div id="button2holder"><small class="story-user"><button id="unfav" type="submit" class="thumb hidden">&#128078</button></div></small>
      </li>
    `);
}

function getDeleteBtnHTML() {
    return `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
}

function getFavBtns(story, user) {
    const isFavorite = user.isFavorite(story);
    const starType = isFavorite ? "fas" : "far";
    return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}

function putFavoritesListOnPage() {
    console.debug("putFavoritesListOnPage");

    $favoritedStories.empty();

    if (currentUser.favorites.length === 0) {
        $favoritedStories.append("<h5>No favorites added!</h5>");
    } else {
        // loop through all of users favorites and generate HTML for them
        for (let story of currentUser.favorites) {
            const $story = generateStoryMarkup(story);
            $favoritedStories.append($story);
        }
    }

    $favoritedStories.show();
}

async function toggleStoryFavorite(evt) {
    console.debug("toggleStoryFavorite");

    const $tgt = $(evt.target);
    const $closestLi = $tgt.closest("li");
    const storyId = $closestLi.attr("id");
    const story = storyList.stories.find(s => s.storyId === storyId);

    console.log($tgt);
    console.log($closestLi);
    console.log($tgt.closest("i"));
    console.log($tgt.children().closest(".thumb"));
    console.log($tgt.siblings());


    // see if the item is already favorited (checking by presence of star)
    if ($tgt.hasClass("fas") /*$tgt.hasClass("heart")*/) {
        // currently a favorite: remove from user's fav list and change star
        await currentUser.removeFavorite(story);
        $tgt.closest("i").toggleClass("fas far");
        /*$tgt.siblings().toggleClass("hidden #");*/
    } else {
        // currently not a favorite: do the opposite
        await currentUser.addFavorite(story);
        $tgt.closest("i").toggleClass("fas far");
        /*$tgt.next().toggleClass("hidden #");*/
        
    }

    
}

async function toggleStoryFavorite1(evt) {
    console.debug("toggleStoryFavorite1");

    const $tgt = $(evt.target);
    const $closestLi = $tgt.closest("li");
    const storyId = $closestLi.attr("id");
    const story = storyList.stories.find(s => s.storyId === storyId);

    //console.log($tgt.parents("li").children("span").children());
    //console.log($tgt.siblings());
    //console.log($closestLi);
    //console.log($tgt.parent());
    //console.log($tgt.closest("#button2holder"));
    //console.log($tgt.siblings("#button1holder"));
    //console.log($("#button2holder").siblings("#button1holder"));

    // see if the item is already favorited (checking by presence of star)
    if ($tgt.hasClass("heart") && $tgt.parents("li").children("span").children().hasClass("fas")) {
        // currently a favorite: remove from user's fav list and change star
        await currentUser.removeFavorite(story);
        $tgt.parents("li").children("span").children().toggleClass("fas far");
        /*$tgt.closest("#button1holder").siblings("#button2holder").toggleClass("hidden #");*/
    } else if ($tgt.hasClass("heart") && $tgt.parents("li").children("span").children().hasClass("far")) { 
        // currently not a favorite: do the opposite
        await currentUser.addFavorite(story);
        $tgt.parents("li").children("span").children().toggleClass("fas far");
        /*$("#button2holder").siblings("#button1holder").toggleClass("hidden #");*/
    }


}

$storiesLists.on("click", ".star", toggleStoryFavorite);
$storiesLists.on("click", ".heart", toggleStoryFavorite1);
/*$storiesLists.on("click", ".thumb" , toggleStoryFavorite1);*/


/** Gets list of stories from server, generates their HTML, and puts on page. */



function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();
    $favoritedStories.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

async function deleteStory(evt) {
    console.debug("deleteStory");

    const $closestLi = $(evt.target).closest("li");
    const storyId = $closestLi.attr("id");

    await storyList.removeStory(currentUser, storyId);

    // re-generate story list
    await putUserStoriesOnPage();
}

$ownStories.on("click", ".trash-can", deleteStory);

async function addStoryFromForm(evt) {
    console.debug("addStoryFromForm");
    evt.preventDefault();
    const title = $("#create-title").val();
    const url = $("#create-url").val();
    const author = $("#create-author").val();
    const username = currentUser.username
    const storyData = { title, url, author, username };
    const story = await storyList.addStory(currentUser, storyData);

    const $story = generateStoryMarkup(story);
    $allStoriesList.prepend($story);

    // hide the form and reset it
    $submitForm.slideUp("slow");
    $submitForm.trigger("reset");
}
$submitForm.on("submit", addStoryFromForm);

function putUserStoriesOnPage() {
    console.debug("putUserStoriesOnPage");

    $ownStories.empty();
    $favoritedStories.empty();

    if (currentUser.ownStories.length === 0) {
        $ownStories.append("<h5>No stories added by user yet!</h5>");
    } else {
        // loop through all of users stories and generate HTML for them
        for (let story of currentUser.ownStories) {
            let $story = generateStoryMarkup(story, true);
            $ownStories.append($story);
        }
    }

    $ownStories.show();
}