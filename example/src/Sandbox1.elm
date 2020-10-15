module Sandbox1 exposing (..)

import Browser
import Html exposing (Html, text)
import Html.Attributes exposing (id)
import Html.Events exposing (onClick)
import Indirect


main =
    Browser.sandbox
        { init = init
        , view = view
        , update = update
        }


type alias Model =
    { count : Int }


init : Model
init =
    { count = Indirect.init }


type Msg
    = Reset
    | Add Int


update : Msg -> Model -> Model
update msg model =
    case msg of
        Reset ->
            { model | count = 0 }

        Add increment ->
            { model | count = model.count + increment }


view : Model -> Html Msg
view model =
    Html.div []
        [ Html.p []
            [ text "Counter value is: "
            , Html.span [ id "counter-value" ] [ text <| String.fromInt model.count ]
            ]
        , Html.button [ onClick <| Add 1, id "add-1" ] [ text "+" ]
        , Html.button [ onClick <| Add 3, id "add-3" ] [ text "+++" ]
        , Html.button [ onClick Reset, id "reset" ] [ text "0" ]
        ]
