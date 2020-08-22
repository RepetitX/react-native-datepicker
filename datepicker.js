import React, {Component} from 'react';
import {View, TouchableOpacity, Linking} from 'react-native';
import {
    Form,
    Item,
    Label,
    Input,
    Button,
    Text,
    Content,
    Spinner
} from 'native-base';
import DatePicker from 'react-native-datepicker';
import moment from "moment/moment";
import {connect} from 'react-redux';

import {colors} from '/Config';
import request from '/RepetitAppCore/httpTransport';
import PhoneInput from '/Components/Teacher/Pupils/PhoneInput';
import {validators} from '/Utils';
import repetitAppCore from '/RepetitAppCore/index';
import bus from '/RepetitAppCore/Bus';

@connect(state => state.authData)
export default class TeacherRegistration extends Component {

    constructor(props) {
        super();

        this.state = {
            step: 0,
            request: false,
            lastName: '',
            firstName: '',
            patrName: '',
            sex: null,
            birthDate: null,
            experience: null,
            phoneNumber: '+7',
            email: '',
            areaId: null,
            password: '',
            confirmPassword: '',
            cityName: null,
            areaName: null,
            confirmationCode: ''
        }
    }

    renderError = () => {
        if (!this.state.errors) return null;

        return (
            <View style={styles.errorWrapper}>
                <View><Text style={styles.errorBold}>Ошибка: </Text></View>
                {(() => this.state.errors.map((err, key) => <View key={key}><Text style={styles.error}>{err}</Text></View>))()}
            </View>
        )
    };

    teacherRegister() {

        const data = {};

        data.lastName = this.state.lastName;
        data.firstName = this.state.firstName;
        data.patrName = this.state.patrName;
        data.sex = this.state.sex;
        data.birthDate = this.state.birthDate;
        data.experience = this.state.experience;
        data.phoneNumber = this.state.phoneNumber;
        data.email = this.state.email;
        data.areaId = this.state.areaId;
        data.password = this.state.password;

        this.setState({
            errors: null,
            request: true
        });

        this.hash = null;

        request({
            url: '/api/teacherRegister',
            method: 'POST',
            data
        }).then((response) => {
            this.hash = response.hash;

            this.setState({
                step: 1,
                request: false
            });
        }).catch((response) => {
            let errors = ['Что-то пошло не так. Проверьте соединение с интернетом и повторите попытку.'];

            if (response.status && response.status == 409) {
                errors = [JSON.parse(response.responseText).errorMessage]
            }

            console.log(response);
            this.setState({
                errors,
                request: false
            });
        });
    }

    confirmRegister() {
        this.setState({
            errors: null,
            request: true
        });

        request({
            url: '/api/verifyRegistrationCode',
            method: 'POST',
            data: {
                hash: this.hash,
                confirmationCode: this.state.confirmationCode
            }
        }).then((response) => {
            const {phoneNumber: login, password} = this.state;

            repetitAppCore.authenticate({login, password})
                .then(() => {
                    this.props.navigator.navigate('TeacherCabinet');

                    request({
                        url: '/api/teacher/autologinUrl',
                        data: {
                            localPath: encodeURIComponent('/teacher/edit/photo')
                        }
                    }).then(url => {
                        Linking.openURL(url)
                    });
                });



        }).catch((response) => {
            let errors = ['Что-то пошло не так. Проверьте соединение с интернетом и повторите попытку.'];

            if (response.status && response.status == 400) {
                errors = [JSON.parse(response.responseText).errorMessage]
            }

            console.log(response);
            this.setState({
                errors,
                request: false
            });
            /*
            console.log(response);
            this.setState({
                errors: ['Что-то пошло не так. Проверьте соединение с интернетом и повторите попытку.'],
                request: false
            })*/
        });
    }

    validate = () => {
        let errors = [];

        if (!this.state.firstName.length) {
            errors.push('Укажите ваше имя.');
        }
        if (!this.state.lastName.length) {
            errors.push('Укажите вашу фамилию.');
        }
        if (this.state.sex === null) {
            errors.push('Укажите ваш пол.');
        }
        if (this.state.birthDate === null) {
            errors.push('Укажите вашу дату рождения.');
        } else if (moment().diff(moment(this.state.birthDate, 'DD.MM.YYYY'), 'years') < 18) {
            errors.push('Для регистрации вы должны быть старше 18 лет.');
        }
        if (this.state.experience === null || !validators.number(this.state.experience)) {
            errors.push('Укажите ваш стаж.');
        }
        if (!validators.cellPhone(this.state.phoneNumber)) {
            errors.push('Не корректно указан номер телефона.');
        }
        if (!validators.email(this.state.email)) {
            errors.push('Не корректно указан email.');

            bus.emit('log', {
                method: 'TeacherRegistration.js',
                message: 'Не корректно указан email при регистрации.',
                stackTrace: 'TeacherRegistration.js',
                data: this.state.email
            });
        }
        if (this.state.areaId === null) {
            errors.push('Укажите ваш регион.');
        }
        if (this.state.password.length < 6) {
            errors.push('Минимальная длина пароля - 6 символов.');
        } else if (this.state.password !== this.state.confirmPassword) {
            errors.push('Поля «пароль» и «пароль еще раз» должны совпадать.');
        }

        if (errors.length) {
            this.setState({errors})
        } else if (this.state.errors) {
            this.setState({errors: null})
        }

        return !errors.length;
    };

    render() {

        if (this.state.step === 1) {
            return (
                <Content style={styles.flexOne}>
                    <Form style={styles.form}>
                        <Text style={{padding: 15, paddingBottom: 5}}>{`На номер ${this.state.phoneNumber} отправлено СМС с кодом подтверждения. Для продолжения регистрации введите этот код.`}</Text>
                        <Item stackedLabel>
                            <Label style={styles.labelOpacity}>Код подтверждения</Label>
                            <Input
                                onChangeText={confirmationCode => this.setState({confirmationCode})}
                                autoCorrect={false}
                                style={styles.input}
                                padding={0}
                                keyboardType='phone-pad'
                                value={this.state.confirmationCode}
                                autoFocus={true}
                            />
                        </Item>
                    </Form>
                    {this.renderError()}
                    <Button
                        primary
                        block
                        style={styles.btn}
                        onPress={() => {
                            this.confirmRegister();
                        }}
                    >
                        {this.state.request ? <Spinner size='small' color='white'/> : <Text>Подтвердить</Text>}
                    </Button>
                </Content>
            )
        }

        let maleButtonStyle = styles.sexRadioButtonMale;
        let femaleButtonStyle = styles.sexRadioButtonFemale;
        let maleButtonTextStyle = styles.sexRadioButtonText;
        let femaleButtonTextStyle = styles.sexRadioButtonText;

        if (this.state.sex == 1) {
            maleButtonStyle = {...styles.sexRadioButtonMale, backgroundColor: colors.primaryColor};
            maleButtonTextStyle = {...styles.sexRadioButtonText, color: 'white'};
        } else if (this.state.sex == 2) {
            femaleButtonStyle = {...styles.sexRadioButtonFemale, backgroundColor: colors.primaryColor};
            femaleButtonTextStyle = {...styles.sexRadioButtonText, color: 'white'};
        }

        return (
            <Content style={styles.flexOne}>
                <Form style={styles.form}>
                    <Item stackedLabel>
                        <Label style={styles.labelOpacity}>Фамилия</Label>
                        <Input
                            onChangeText={lastName => this.setState({lastName})}
                            autoCorrect={false}
                            style={styles.input}
                            padding={0}
                            value={this.state.lastName}
                            autoFocus={true}
                        />
                    </Item>
                    <Item stackedLabel>
                        <Label style={styles.labelOpacity}>Имя</Label>
                        <Input
                            onChangeText={firstName => this.setState({firstName})}
                            autoCorrect={false}
                            style={styles.input}
                            padding={0}
                            value={this.state.firstName}
                        />
                    </Item>
                    <Item stackedLabel>
                        <Label style={styles.labelOpacity}>Отчество</Label>
                        <Input
                            onChangeText={patrName => this.setState({patrName})}
                            autoCorrect={false}
                            style={styles.input}
                            padding={0}
                            value={this.state.patrName}
                        />
                    </Item>
                    <Item style={styles.sex}>
                        <Label style={styles.sexLabel}>Пол</Label>
                        <View style={styles.sexRadioGroup}>
                            <TouchableOpacity onPress={() =>  this.setState({sex: 1})} style={maleButtonStyle}>
                                <Text style={maleButtonTextStyle}>Мужской</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() =>  this.setState({sex: 2})} style={femaleButtonStyle}>
                                <Text style={femaleButtonTextStyle}>Женский</Text>
                            </TouchableOpacity>
                        </View>
                    </Item>

                    <Item stackedLabel style={styles.birthDate}>
                        <Label style={styles.labelOpacity}>Дата рождения</Label>
                        <View style={styles.datePickerWrapper}>
                            <DatePicker
                                ref='datePicker'
                                style={styles.datePicker}
                                display={'spinner'}
                                date={this.state.birthDate ? moment(this.state.birthDate, 'DD.MM.YYYY') : false}
                                //minDate={moment().startOf('day').add(1, 'days')}
                                placeholder={'укажите дату'}
                                format='D MMMM YYYY г'
                                confirmBtnText='Готово'
                                cancelBtnText='Отмена'
                                onDateChange={(d, rawDate) => {
                                    const birthDate = moment(rawDate).startOf('day').format('DD.MM.YYYY');
                                    this.setState({birthDate})
                                }}
                                showIcon={false}
                                customStyles={{
                                    ...dateInputStyle,
                                    dateInput: {...dateInputStyle.dateInput, alignItems: 'flex-start'}
                                }}
                            />
                        </View>
                    </Item>

                    <Item stackedLabel>
                        <Label style={styles.labelOpacity}>Стаж (лет)</Label>
                        <Input
                            onChangeText={experience => this.setState({experience})}
                            autoCorrect={false}
                            style={styles.input}
                            padding={0}
                            keyboardType='phone-pad'
                            value={this.state.experience}
                        />
                    </Item>

                    <PhoneInput
                        autoCorrect={false}
                        value={this.state.phoneNumber}
                        onChangeText={phoneNumber => this.setState({phoneNumber})}
                    />

                    <Item stackedLabel>
                        <Label style={styles.labelOpacity}>Email</Label>
                        <Input
                            onChangeText={email => this.setState({email: email.trim()})}
                            autoCorrect={false}
                            style={styles.input}
                            padding={0}
                            value={this.state.email}
                        />
                    </Item>

                    <Item stackedLabel style={styles.selectArea}>
                        <Label style={styles.labelOpacity}>Регион</Label>
                        <TouchableOpacity
                            onPress={() => {
                                this.props.navigator.navigate('SelectArea', {
                                    onSelect: area => {
                                        let areaId = area.id;
                                        let [cityName, areaName] = area.name.split(' и ');

                                        this.setState({areaId, cityName, areaName})
                                    }
                                })
                            }}
                            style={styles.selectedArea}
                        >
                            {(() => {
                                if (this.state.areaId) {
                                    return [
                                        <Text style={styles.city}>{this.state.cityName}</Text>,
                                        <Text style={styles.area}>{this.state.areaName}</Text>
                                    ];
                                }

                                return <Text>выберите регион</Text>
                            })()}

                        </TouchableOpacity>
                    </Item>


                    <Item stackedLabel>
                        <Label style={styles.labelOpacity}>Пароль</Label>
                        <Input
                            secureTextEntry={true}
                            onChangeText={password => this.setState({password})}
                            autoCorrect={false}
                            style={styles.input}
                            padding={0}
                            value={this.state.password}
                        />
                    </Item>
                    <Item stackedLabel>
                        <Label style={styles.labelOpacity}>Пароль еще раз</Label>
                        <Input
                            secureTextEntry={true}
                            onChangeText={confirmPassword => this.setState({confirmPassword})}
                            autoCorrect={false}
                            style={styles.input}
                            padding={0}
                            value={this.state.confirmPassword}
                        />
                    </Item>
                </Form>
                {this.renderError()}
                <Button
                    primary
                    block
                    style={styles.btn}
                    onPress={() => {
                        if (this.validate()) {
                            this.teacherRegister()
                        }
                    }}
                >
                    {this.state.request ? <Spinner size='small' color='white'/> : <Text>Зарегистрироваться</Text>}
                </Button>
            </Content>
        )
    }
}

const dateInputStyle = {
    dateInput: {
        borderWidth: 0,
        alignSelf: 'stretch',
        height: 20,
    },
    dateText: {
        marginTop: 1,
        textAlign: 'left',
        fontSize: 16,
        lineHeight: 16,
        color: 'black'
    },
    placeholderText: {
        marginTop: 1,
        fontSize: 16,
        lineHeight: 16,
        color: 'black'
    },
    btnTextConfirm: {
        height: 20
    },
    btnTextCancel: {
        height: 20
    }
};


const styles = {

    sex: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderBottomWidth: 0
    },
    sexLabel: {
        fontSize: 15,
        marginTop: 12,
        opacity: .85
    },
    sexRadioGroup: {
        flexDirection: 'row',
        marginRight: 15,
        marginVertical: 5
    },
    sexRadioButtonMale: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: colors.primaryColor,
        backgroundColor: 'white',
        borderBottomLeftRadius: 2,
        borderTopLeftRadius: 2,
        borderRightWidth: 0
    },
    sexRadioButtonFemale: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: colors.primaryColor,
        backgroundColor: 'white',
        borderBottomRightRadius: 2,
        borderTopRightRadius: 2
    },
    sexRadioButtonText: {
        fontSize: 15,
        color: colors.primaryColor
    },
    labelOpacity: {
        opacity: .85
    },
    birthDate: {
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    datePickerWrapper: {
        marginBottom: 10,
        marginTop: 15,
        flex: 1,
        height: 20,
        width: '100%'
    },
    selectArea: {
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    selectedArea: {
        marginRight: 15,
        marginVertical: 10
    },

    datePicker: {
        width: '100%',
        height: 21
    },
    input: {
        marginLeft: 0
    },
    btn: {
        marginTop: 15,
        marginBottom: 30
    },
    flexOne: {
        flex: 1,
        padding: 15
    },
    form: {
        margin: -15,
        marginBottom: 0
    },
    /*finalText: {
        fontFamily: 'Roboto-Light',
        color: colors.textGray
    },*/
    /*finalTextBold: {
        fontFamily: 'Roboto-Medium',
        color: 'black'
    },*/
    errorWrapper: {
        marginTop: 15
    },
    errorBold: {
        color: colors.dangerColor,
        fontFamily: 'Roboto-Medium'
    },
    error: {
        color: colors.dangerColor,
        fontFamily: 'Roboto-Light'
    },
    city: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: 'black'
    },
    area: {
        fontSize: 14,
        fontFamily: 'Roboto-Light',
        color: '#777'
    },
    webView: {
        flex: 1
    }
};