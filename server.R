# Server
bbox <- NULL
msg <- "Welcome OSM Downloader.
You can download OSM data by the following:
1. Set the size of the area to download.
2. Click the center of the area you want to download on the map.
3. Click the \"Download\" button."

server <- function(input, output, session) {
    
  # Initialize
  output$map <- renderLeaflet({
    leaflet(options = leafletOptions(minZoom = 3)) |>
      addTiles() |>
      setMaxBounds(-180, -180, 180, 180) |>
      setView(
        lng  = 135.9480166,
        lat  = 34.9708486,
        zoom = 12
      ) |>
      addMiniMap()
  })
  output$messages <- renderText(msg)
  
  observeEvent(input$search, {
    if (input$search_area == "") return()
    
    bb <- getbb(input$search_area)
    search_area_x <- mean(bb[1,])
    search_area_y <- mean(bb[2,])
    
    leafletProxy(mapId = "map") |>
      setView(lng = search_area_x, lat = search_area_y, zoom = input$map_zoom)
  })
  
  # Event when user click on the map
  observeEvent(list(input$map_click, input$width, input$height), {
    if (is.null(input$map_click)) return()
    
    # Get the coordinate clicked
    lat <- input$map_click$lat
    lng <- input$map_click$lng
    
    # Calculate the area to download osm
    t <- destPoint(p = c(lng, lat), b = 0, d = input$height / 2)[2]
    r <- destPoint(p = c(lng, lat), b = 90, d = input$width / 2)[1]
    b <- destPoint(p = c(lng, lat), b = -180, d = input$height / 2)[2]
    l <- destPoint(p = c(lng, lat), b = -90, d = input$width / 2)[1]
    rt <- c(r, t); rb <- c(r, b)
    lb <- c(l, b); lt <- c(l, t)
    bbox <<- c(l, b, r, t)
    area <- rbind(rt, rb, lb, lt, rt) |>
      list() |>
      st_polygon()
    
    # Plot the area to download OSM
    leafletProxy(mapId = "map") |>
      removeMarker(layerId = "center") |>
      removeShape(layerId = "area") |>
      addMarkers(lng, lat, layerId = "center",
                 popup = paste0("Latitude: ", lat, "<br> Longitude: ", lng)) |>
      addPolygons(data = area, layerId = "area")
  })
  
  # Event when user click download button
  output$osm_data <- downloadHandler(
    filename = function() {
      paste("dataset-", Sys.Date(), ".osm", sep="")
    },
    content = function(file) {
      output$messages <- renderText(msg)
      q <- opq(bbox = bbox) |>
        add_osm_features(features = c("\"building\"", "\"highway\""))
      map_elements <- osmdata_sf(q)
      leafletProxy(mapId = "map") |>
        removeShape(layerId = "elements") |>
        addPolygons(color = "green", data = map_elements$osm_polygons) |>
        addPolylines(color = "red", data = map_elements$osm_lines)
      osmdata_xml(q, file)
      output$messages <- renderText(msg)
    }
  )
  
}
