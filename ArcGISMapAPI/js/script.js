        require                                     /*Burada harita üzerinde kullanmamız gereken modül bildirimlerini yapıyoruz.*/
        (
            [
                "esri/config",
                "esri/Map",
                "esri/views/MapView",
                "esri/widgets/BasemapToggle",
                "esri/widgets/Expand",
                "esri/request",
                "esri/layers/FeatureLayer",
                "esri/layers/support/Field",
                "esri/Graphic",
                "esri/rest/locator",
                "esri/widgets/Search",
                "esri/layers/VectorTileLayer"
            ],
            function(esriConfig, Map, MapView, BasemapToggle, Expand, request, FeatureLayer, Field, Graphic, locator, Search, VectorTileLayer)
            {
                esriConfig.apiKey = "AAPK8f3e8f097a68460b9eefc040cbab5133zzfLF6dxHf7sn_9eDWr3z82odopvnwsBPgGSnqeYNnPtoQ1V8hYGRY9wxSWCzjOP";
                const portalUrl = "https://www.arcgis.com";
                const locatorUrl = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";       //Dünya coğrafi kodlama hizmetini kullanarak bir konum belirleme url'si ayarlayın 
                const map=new Map
                ({
                    basemap:"arcgis-topographic"                                //Basemap'in türünün seçilmesi
                });
                const view=new MapView                                          // Haritanın görüntülenmesi için const tipinde view nesnesinin oluşturulması.
                ({
                    map:map,
                    center:[36.805,38.027],
                    zoom:5,
                    container:"viewDiv",
                    popup:
                    {
                        defaultPopupTemplateEnabled: true
                    }
                });
                const basemapToggle=new BasemapToggle                           // Basemap seçilmesi sağlamak için nesne oluşturulması.
                ({
                    view:view,
                    nextBasemap:"arcgis-imagery"
                });
                const search=new Search
                ({
                    view:view
                });
                const fileForm = document.getElementById("mainWindow");                 // Shape dosyasının yüklenmesi için ikon simgesinin görüntülenmesini sağlayan nesnenin oluşturulması
                const expand = new Expand
                ({
                expandIconClass: "esri-icon-upload",
                view: view,
                content: fileForm
                });
                const vtLayer = new VectorTileLayer
                ({
                    style:
                    {
                        layers:
                        [
                            {
                            layout:
                            {

                            },
                            paint:
                            {
                                "fill-color":"#93CFC7"
                            },
                            source:"esri",
                            minzoom:0,
                            "source-layer": "Marine area",
                            type: "fill",
                            id: "Marine area/1"
                            },
                            {
                            layout:
                            {

                            },
                            paint:
                            {
                                "fill-pattern": "Marine area",
                                "fill-opacity": 0.08
                            },
                            source:"esri",
                            minzoom:0,
                            "source-layer": "Marine area",
                            type: "fill",
                            id: "Marine area/2"
                            },
                            {
                            layout:
                            {
                                "text-font": ["Arial Regular"],
                                "text-anchor": "center",
                                "text-field": "{_name_global}"
                            },
                            paint:
                            {
                                "text-color": "#AF420A"
                            },
                            source:"esri",
                            "source-layer": "Continent",
                            type: "symbol",
                            id: "Continent"
                            },
                            {
                            layout:
                            {
                                "text-font": ["Arial Regular"],
                                "text-field": "{_name}",
                                "text-transform": "none"
                            },
                            paint:
                            {
                                "text-color": "#000000"
                            },
                            source:"esri",
                            minzoom: 2,
                            "source-layer": "Admin0 point",
                            maxzoom:50,
                            type: "symbol",
                            id: "Admin0 point/large"
                            }
                        ],
                        glyphs:"https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/resources/fonts/{fontstack}/{range}.pbf", 
                        version:8,
                        sprite:"https://www.arcgis.com/sharing/rest/content/items/7675d44bb1e4428aa2c30a9b68f97822/resources/sprites/sprite",
                        sources:
                        {
                            esri:
                            {
                                url:"https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer",
                                type:"vector"
                            }
                        }
                    }
                });
                map.add(vtLayer);
                document.getElementById("uploadForm").addEventListener("change", (event) =>
                {
                    const fileName = event.target.value.toLowerCase();
                    if (fileName.indexOf(".zip") !== -1)
                    {
                        generateFeatureCollection(fileName);
                    }
                    else
                    {
                        ocument.getElementById('upload-status').innerHTML = '<p style="color:red">Shape dosyasını sıkıştılışmış (.zip) dosyası halinde yükleyiniz.</p>';
                    }
                });
                function generateFeatureCollection (fileName)
                {
                    let name = fileName.split(".");
                    name = name[0].replace("c:\\fakepath\\", "");
                    document.getElementById('upload-status').innerHTML = '<b>Yükleniyor... </b>' + name;
                    const params={'name': name, 'targetSR': view.spatialReference, 'maxRecordCount': 1000, 'enforceInputFileSizeLimit': true, 'enforceOutputJsonSizeLimit': true};
                    params.generalize = true;
                    params.maxAllowableOffset = 10;
                    params.reducePrecision = true;
                    params.numberOfDigitsAfterDecimal = 0;
                    const myContent = {'filetype': 'shapefile', 'publishParameters': JSON.stringify(params), 'f': 'json',};
                    request(portalUrl + '/sharing/rest/content/features/generate', {query: myContent, body: document.getElementById('uploadForm'), responseType: 'json'})
                    .then
                    (
                        (response)=>
                        {
                            const layerName = response.data.featureCollection.layers[0].layerDefinition.name;
                            document.getElementById('upload-status').innerHTML = '<b>Loaded: </b>' + layerName;
                            addShapefileToMap(response.data.featureCollection);
                        }
                    )
                    .catch(errorHandler);
                }
                function errorHandler (error)
                {
                    document.getElementById('upload-status').innerHTML = "<p style='color:red;max-width: 500px;'>" + error.message + "</p>";
                }
                function addShapefileToMap (featureCollection)
                {
                    let sourceGraphics = [];
                    const layers = featureCollection.layers.map
                    (
                        (layer)=>
                        {
                            const graphics = layer.featureSet.features.map
                            (
                                (feature)=>
                                {
                                    return Graphic.fromJSON(feature);
                                }
                            )
                            sourceGraphics = sourceGraphics.concat(graphics);
                            const featureLayer = new FeatureLayer
                            (
                                {
                                    objectIdField: "FID",
                                    source: graphics,
                                    fields: layer.layerDefinition.fields.map
                                    (
                                        (field)=>
                                        {
                                            return Field.fromJSON(field);
                                        }
                                    )
                                }
                            );
                            return featureLayer;
                        }
                    );
                    map.addMany(layers);
                    view.goTo(sourceGraphics).catch
                    (
                        (error)=>
                        {
                            if (error.name != "AbortError")
                            {
                                console.error(error);
                            }
                        }
                    );
                    document.getElementById('upload-status').innerHTML = "";
                }
                view.popup.autoOpenEnabled = false;
                view.on("click", (event) =>
                {
                    const lat = Math.round(event.mapPoint.latitude * 1000) / 1000;
                    const lon = Math.round(event.mapPoint.longitude * 1000) / 1000;
                    view.popup.open
                    (
                        {
                            title: "Reverse geocode: [" + lon + ", " + lat + "]",
                            location: event.mapPoint
                        }
                    );
                    const params = {location: event.mapPoint};
                    locator.locationToAddress(locatorUrl, params).then
                    (
                        (response)=>
                        {
                            view.popup.content = response.address;
                        }
                    )
                    .catch
                    (
                        ()=>
                        {
                            view.popup.content = "No address was found for this location";
                        }
                    );
                }
                );
                document.getElementById("layoutButton").addEventListener
                (
                    "click",
                    (

                    )=>
                    {
                        const styleLayer = vtLayer.getStyleLayer("Admin0 point/large");
                        styleLayer.layout["text-transform"] = styleLayer.layout["text-transform"] == "uppercase" ? "none" : "uppercase";
                        vtLayer.setStyleLayer(styleLayer);
                    }
                );
                document.getElementById("paintButton").addEventListener
                (
                    "click",
                    (

                    )=>
                    {
                        const paintProperties = vtLayer.getPaintProperties("Marine area/1");
                        paintProperties["fill-color"] = paintProperties["fill-color"] == "#93CFC7" ? "#0759C1" : "#93CFC7";
                        vtLayer.setPaintProperties("Marine area/1", paintProperties);
                    }
                );
                view.ui.add(basemapToggle,"bottom-left");    // Basemap'in görüntülenmesi.
                view.ui.add(expand, "top-left");             // Shape dosyası yüklenme butonunun görüntülenmesi.
                view.ui.add(search, "top-right");            // Haritada arama yapmak için arama çubuğunun görüntülenmesi.
                view.ui.add("topbar", "bottom-right");       // Stil çubuğunun görüntülenmesi.



            }

        )
