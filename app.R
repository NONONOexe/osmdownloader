# Install packages
options(repos = "https://cran.rstudio.com/")
if (!suppressWarnings(require(pacman, quietly = TRUE))) {
  install.packages("pacman")
}
pacman::p_load("shiny", "leaflet", "sf", "geosphere", "osmdata")  

# Run application
runApp(appDir = ".", launch.browser = TRUE)
