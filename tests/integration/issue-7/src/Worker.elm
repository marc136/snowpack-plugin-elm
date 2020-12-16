module Worker exposing (main)

main : Program () () msg
main =
    Platform.worker
        { init = \flags ->( (), Cmd.none )
        , update = \msg model -> ( model, Cmd.none )
        , subscriptions = \model -> Sub.none
        }