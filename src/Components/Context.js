import React from 'react';

export const Context = React.createContext({});
export const withContext = View => props => <Context.Consumer>{context => <View {...props} context={context}/>}</Context.Consumer>;