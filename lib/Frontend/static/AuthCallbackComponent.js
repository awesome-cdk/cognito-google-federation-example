'use strict';

const AuthCallbackComponent = (props) => {
    const code = props.code;

    const [token, setToken] = React.useState({});

    React.useEffect(function () {
        const url = new URL("/prod/auth/callback", document.location);
        url.searchParams.append('code', code);

        fetch(url.toString())
            .then(result => result.json())
            .then(result => {
                const token = result.data;
                setToken(token);
            });
    }, [code]);

    return React.createElement(
        'div',
        {},
        JSON.stringify(token),
    );
}
