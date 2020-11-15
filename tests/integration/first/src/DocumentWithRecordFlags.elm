module DocumentWithRecordFlags exposing (..)

import Browser
import Html exposing (Html, text)
import Html.Attributes exposing (id)
import Html.Events exposing (onClick)
import Indirect
import Json.Decode


main : Program Flags Model Msg
main =
    Browser.document
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


type alias Model =
    { count : Int }


type alias Flags =
    -- Json.Decode.Value
    { test : String, startValue : Int }


init : Flags -> ( Model, Cmd msg )
init { startValue } =
    ( { count = startValue }, Cmd.none )


type Msg
    = Reset
    | Add Int


update : Msg -> Model -> ( Model, Cmd msg )
update msg model =
    case msg of
        Reset ->
            ( { model | count = 0 }, Cmd.none )

        Add increment ->
            ( { model | count = model.count + increment }, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none


view : Model -> Browser.Document Msg
view model =
    { title = "Document Title"
    , body =
        [ Html.div []
            [ Html.p []
                [ text "Counter value is: "
                , Html.span [ id "counter-value" ] [ text <| String.fromInt model.count ]
                ]
            , Html.button [ onClick <| Add 1, id "add-1" ] [ text "+" ]
            , Html.button [ onClick <| Add 3, id "add-3" ] [ text "+++" ]
            , Html.button [ onClick Reset, id "reset" ] [ text "0" ]
            ]
        ]
    }
