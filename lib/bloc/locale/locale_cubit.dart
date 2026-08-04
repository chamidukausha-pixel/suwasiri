import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleState extends Equatable {
  const LocaleState(this.locale);

  final Locale locale;

  @override
  List<Object?> get props => [locale];
}

class LocaleCubit extends Cubit<LocaleState> {
  LocaleCubit(this.prefs)
      : super(LocaleState(Locale(prefs.getString(_key) ?? 'en')));

  final SharedPreferences prefs;
  static const _key = 'suwasiri_locale';

  void setLocale(Locale locale) {
    prefs.setString(_key, locale.languageCode);
    emit(LocaleState(locale));
  }

  void cycle() {
    const order = ['en', 'si', 'ta'];
    final i = order.indexOf(state.locale.languageCode);
    final next = order[(i + 1) % order.length];
    setLocale(Locale(next));
  }

  String get pillLabel {
    switch (state.locale.languageCode) {
      case 'si':
        return 'සිං';
      case 'ta':
        return 'TA';
      default:
        return 'EN';
    }
  }
}
