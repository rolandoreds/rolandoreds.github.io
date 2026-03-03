$(function () {
  const $title = $("#mainTitle");
  const $photo = $("#profilePhoto");
  const $btn = $("#animateBtn");

  const originalColor = $title.css("color");

  //transform on text
  $title.css({
    display: "inline-block",
    transform: "scale(1)"
  });

  $btn.on("click", function () {
    $btn.prop("disabled", true);

    // Add border around picture
    $photo.css("border", "4px solid #000");

    // Change color, then revert 
    $title.css("color", "crimson");
    setTimeout(function () {
      $title.css("color", originalColor);
    }, 1300); 

    // Animate 
    $title
      .animate({ opacity: 1 }, 600, function () {
        $title.css("transform", "scale(1.25)");
      })
      .animate({ opacity: 1 }, 600, function () {
        $title.css("transform", "scale(1)");
        $btn.prop("disabled", false);
      });
  });
});
