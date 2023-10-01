# Client
fluidPage(
  
  tags$style(
    type = "text/css",
    "pre.shiny-text-output {
      margin-top: 10px;
      white-space: pre-line;
    }"),

  titlePanel("OSM Downloader"),
  
  fluidRow(
    column(
      width = 2,
      
      # Width of download area
      numericInput(
        inputId = "width",
        value = 2000,
        label = "Width (m)",
        min = 0,
        max = 3500),
      
      # Height of download area
      numericInput(
        inputId = "height",
        value = 2000,
        label = "Height (m)",
        min = 0,
        max = 3500)
    ),
    column(
       width = 8,
       
       # Search area
       fluidRow(
         column(
           width = 10,
           textInput(
             inputId = "search_area",
             label = NULL, 
             width = "100%", 
             placeholder = "area name"
           )
         ),
         column(
           width = 2,
           actionButton(
             inputId = "search",
             label = "Search"
           )
         )
       ),
       
       # Map
       leafletOutput("map", height = "600px")
     ),
     
     column(
       width = 2,
       downloadButton("osm_data")
     )
  ),
  
  fluidRow(
    column(
      width = 12,
      verbatimTextOutput("messages")
    )
  )
)
