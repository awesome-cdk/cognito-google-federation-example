'use strict';

const LoginComponent = () => {
    return React.createElement(
        'button',
        {
            onClick: () => {
                fetch('/prod/auth/login')
                    .then(result => result.json())
                    .then(result => {
                        if (result.login_url) {
                            window.location.href = result.login_url;
                        } else {
                            alert('Login URL not returned from backend!');
                        }
                    })
            }
        },
        'Login with Google'
    );
}
